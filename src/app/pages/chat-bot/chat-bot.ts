import {
  Component,
  ElementRef,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

// AJUSTAR: ruta/nombre real del navbar del proyecto (no estaba disponible al implementar).
import { Navbar } from '../../components/navbar/navbar';
import { ChatService } from '../../core/services/chat.service';
import { ChatSessionService } from '../../core/services/chat-session.service';
import { ConversationService } from '../../core/services/conversation.service';
import {
  ChatConversation,
  ChatMessage,
} from '../../interfaces/chat.interface';

export const DEFAULT_CONVERSATION_TITLE = 'Nueva conversación';
const MAX_TITLE_LENGTH = 48;

export interface MarkdownTable {
  headers: string[];
  rows: string[][];
}

function parseTableRow(line: string): string[] | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return null;
  return trimmed
    .slice(1, -1)
    .split('|')
    .map((cell) => cell.trim());
}

export function parseMarkdownTable(content: string): MarkdownTable | null {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return null;

  const headers = parseTableRow(lines[0]);
  const separator = parseTableRow(lines[1]);
  if (!headers?.length || !separator || separator.length !== headers.length) return null;
  if (!separator.every((cell) => /^:?-{3,}:?$/.test(cell))) return null;

  const rows = lines.slice(2).map(parseTableRow);
  if (rows.some((row) => !row || row.length !== headers.length)) return null;

  return { headers, rows: rows as string[][] };
}

function createLocalKey(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  return c?.randomUUID
    ? c.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Titulo visible derivado de la primera pregunta. NO es la identidad de la conversacion. */
export function deriveTitle(question: string): string {
  const firstPhrase = question
    .trim()
    .split(/[\n.?!]/)[0]
    .replace(/^[¿¡\s]+/, '')
    .trim();
  const base = firstPhrase || question.trim();
  return base.length > MAX_TITLE_LENGTH ? `${base.slice(0, MAX_TITLE_LENGTH - 1).trimEnd()}…` : base;
}

export function normalizeConversationSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

@Component({
  selector: 'app-chat-bot',
  imports: [FormsModule, Navbar],
  templateUrl: './chat-bot.html',
  styleUrl: './chat-bot.css',
})
export class ChatBOT {
  private readonly chat = inject(ChatService);
  private readonly conversationsApi = inject(ConversationService);
  private readonly session = inject(ChatSessionService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');
  private stickToBottom = true;

  readonly defaultTitle = DEFAULT_CONVERSATION_TITLE;

  // ---- estado
  readonly conversations = this.session.conversations;
  readonly activeLocalId = this.session.activeLocalId;
  readonly conversationToDelete = signal<ChatConversation | null>(null);
  readonly sidebarOpen = signal(false);
  readonly searchOpen = signal(false);
  readonly searchQuery = signal('');
  /** Texto de error por conversacion (el mensaje del asistente solo guarda el estado). */
  question = '';

  parseTable(content: string): MarkdownTable | null {
    return parseMarkdownTable(content);
  }

  readonly activeConversation = computed<ChatConversation | null>(
    () => this.conversations().find((c) => c.localId === this.activeLocalId()) ?? null,
  );
  readonly filteredConversations = computed(() => {
    const query = normalizeConversationSearch(this.searchQuery());
    if (!query) return this.conversations();

    return this.conversations().filter((conversation) =>
      normalizeConversationSearch(conversation.title).includes(query),
    );
  });
  readonly messages = computed<ChatMessage[]>(() => this.activeConversation()?.messages ?? []);
  readonly isStreaming = computed(() => this.messages().some((m) => m.status === 'streaming'));
  readonly activeError = computed(() => {
    const id = this.activeLocalId();
    return id ? (this.session.errors()[id] ?? null) : null;
  });
  /** El ultimo mensaje del asistente fallido/cancelado es el que se puede reintentar. */
  readonly retryableMessageId = computed(() => {
    if (this.isStreaming()) return null;
    const last = this.messages().at(-1);
    return last && last.role === 'assistant' && (last.status === 'error' || last.status === 'cancelled')
      ? last.id
      : null;
  });

  constructor() {
    this.loadConversations();

    // Mantiene el scroll al final mientras llegan chunks (solo en browser).
    effect(() => {
      this.messages();
      if (!this.isBrowser || !this.stickToBottom) return;
      queueMicrotask(() => {
        const el = this.scroller()?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
      });
    });
  }

  // ------------------------------------------------------------ conversaciones

  newConversation(): void {
    this.interruptActiveResponse();
    // Evita acumular conversaciones vacias: si la activa ya esta vacia, se reutiliza.
    const active = this.activeConversation();
    if (active && active.messages.length === 0) {
      this.sidebarOpen.set(false);
      return;
    }
    this.createConversation();
    this.sidebarOpen.set(false);
  }

  selectConversation(id: string): void {
    if (id === this.activeLocalId()) {
      this.sidebarOpen.set(false);
      return;
    }
    this.interruptActiveResponse();
    this.activeLocalId.set(id);
    this.stickToBottom = true;
    this.sidebarOpen.set(false);

    const conversation = this.conversations().find((item) => item.localId === id);
    if (conversation?.id) {
      this.conversationsApi.getConversation(conversation.id).subscribe({
        next: (response) => {
          const loaded = this.conversationsApi.toChatConversation(response, conversation.localId);
          this.updateConversation(conversation.localId, (current) => ({
            ...current,
            ...loaded,
            id: loaded.id ?? current.id,
            localId: current.localId,
          }));
        },
      });
    }
  }

  requestConversationDeletion(conversation: ChatConversation): void {
    this.conversationToDelete.set(conversation);
  }

  cancelConversationDeletion(): void {
    this.conversationToDelete.set(null);
  }

  confirmConversationDeletion(): void {
    const target = this.conversationToDelete();
    if (!target) return;

    if (target.localId === this.activeLocalId()) {
      this.interruptActiveResponse();
    }
    if (!target.id) {
      this.removeConversation(target);
      return;
    }

    this.conversationsApi.deleteConversation(target.id).subscribe({
      next: () => this.removeConversation(target),
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  toggleSearch(): void {
    this.searchOpen.update((open) => !open);
    if (this.searchOpen()) return;
    this.searchQuery.set('');
  }

  // -------------------------------------------------------------------- envio

  submitQuestion(): void {
    const text = this.question.trim();
    if (!text || this.isStreaming()) return;

    const conversation = this.activeConversation() ?? this.createConversation();
    const now = new Date().toISOString();

    this.updateConversation(conversation.localId, (c) => ({
      ...c,
      title: c.messages.length === 0 ? deriveTitle(text) : c.title,
      updatedAt: now,
      messages: [
        ...c.messages,
        { id: createLocalKey(), role: 'user', content: text, createdAt: now, status: 'complete' },
        this.newAssistantMessage(now),
      ],
    }));
    this.question = '';
    this.stickToBottom = true;
    this.dispatch(conversation.localId, conversation.id, text);
  }

  onComposerEnter(event: Event): void {
    const e = event as KeyboardEvent;
    if (e.shiftKey || e.isComposing) return; // Shift+Enter = salto de linea
    e.preventDefault();
    this.submitQuestion();
  }

  cancelResponse(): void {
    this.interruptActiveResponse();
  }

  /** Reintenta la ultima pregunta sin duplicar el mensaje del usuario. */
  retryLastResponse(): void {
    const conversation = this.activeConversation();
    if (!conversation || this.isStreaming()) return;

    const messages = conversation.messages;
    const failed = messages.at(-1);
    const lastUser = messages.at(-2);
    if (!failed || failed.role !== 'assistant' || failed.status === 'complete') return;
    if (!lastUser || lastUser.role !== 'user') return;

    const now = new Date().toISOString();
    this.updateConversation(conversation.localId, (c) => ({
      ...c,
      updatedAt: now,
      messages: [...c.messages.slice(0, -1), this.newAssistantMessage(now)],
    }));
    this.clearError(conversation.localId);
    this.stickToBottom = true;
    this.dispatch(conversation.localId, conversation.id, lastUser.content);
  }

  onScroll(): void {
    const el = this.scroller()?.nativeElement;
    if (!el) return;
    this.stickToBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }

  // ------------------------------------------------------------------ privado

  private loadConversations(): void {
    this.conversationsApi.getConversations().subscribe({
      next: (responses) => {
        if (this.conversations().length > 0) return;
        this.session.setConversations(
          responses.map((response, index) =>
            this.conversationsApi.toChatConversation(response, `server-${index}-${createLocalKey()}`),
          ),
        );
      },
    });
  }

  /**
   * `backendId` es null para una conversacion nueva (el backend crea el ID) o el ID que el
   * backend ya devolvio. Si el envio falla de inmediato, el servicio emite `error`.
   */
  private dispatch(localId: string, backendId: string | null, text: string): void {
    this.clearError(localId);
    this.chat.send(localId, backendId, text);
  }

  /** Cancela el stream en curso (si lo hay) y marca el mensaje como cancelado. */
  private interruptActiveResponse(): void {
    const id = this.activeLocalId();
    if (!id) return;
    if (this.isStreaming()) {
      this.chat.cancel();
      this.updateStreamingMessage(id, (m) => ({ ...m, status: 'cancelled' }));
    }
  }

  private createConversation(): ChatConversation {
    const now = new Date().toISOString();
    const conversation: ChatConversation = {
      id: null, // lo crea el backend al responder
      localId: createLocalKey(),
      title: DEFAULT_CONVERSATION_TITLE,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    this.conversations.update((list) => [conversation, ...list]);
    this.activeLocalId.set(conversation.localId);
    return conversation;
  }

  private newAssistantMessage(createdAt: string): ChatMessage {
    return { id: createLocalKey(), role: 'assistant', content: '', createdAt, status: 'streaming' };
  }

  private updateConversation(localId: string, fn: (c: ChatConversation) => ChatConversation): void {
    this.session.updateConversation(localId, fn);
  }

  private updateStreamingMessage(localId: string, fn: (m: ChatMessage) => ChatMessage): void {
    this.session.updateStreamingMessage(localId, fn);
  }

  private clearError(localId: string): void {
    this.session.clearError(localId);
  }

  private removeConversation(target: ChatConversation): void {
    const remaining = this.conversations().filter((c) => c.localId !== target.localId);
    this.session.setConversations(remaining);
    this.session.clearError(target.localId);
    if (target.localId === this.activeLocalId()) {
      this.activeLocalId.set(remaining[0]?.localId ?? null);
    }
    this.conversationToDelete.set(null);
  }
}