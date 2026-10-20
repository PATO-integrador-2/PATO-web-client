import { Injectable, inject, signal } from '@angular/core';

import { ChatService } from './chat.service';
import {
  ChatConversation,
  ChatMessage,
  ChatStreamEvent,
} from '../../interfaces/chat.interface';

@Injectable({ providedIn: 'root' })
export class ChatSessionService {
  private readonly chat = inject(ChatService);

  readonly conversations = signal<ChatConversation[]>([]);
  readonly activeLocalId = signal<string | null>(null);
  readonly errors = signal<Record<string, string>>({});

  constructor() {
    this.chat.events$.subscribe((event) => this.onStreamEvent(event));
  }

  setConversations(conversations: ChatConversation[]): void {
    this.conversations.set(conversations);
  }

  updateConversation(localId: string, fn: (conversation: ChatConversation) => ChatConversation): void {
    this.conversations.update((list) =>
      list.map((conversation) =>
        conversation.localId === localId ? fn(conversation) : conversation,
      ),
    );
  }

  updateStreamingMessage(localId: string, fn: (message: ChatMessage) => ChatMessage): void {
    this.updateConversation(localId, (conversation) => {
      let index = -1;
      for (let i = conversation.messages.length - 1; i >= 0; i--) {
        if (
          conversation.messages[i].role === 'assistant' &&
          conversation.messages[i].status === 'streaming'
        ) {
          index = i;
          break;
        }
      }
      if (index === -1) return conversation;

      const messages = conversation.messages.slice();
      messages[index] = fn(messages[index]);
      return { ...conversation, messages, updatedAt: new Date().toISOString() };
    });
  }

  clearError(localId: string): void {
    this.errors.update(({ [localId]: _removed, ...rest }) => rest);
  }

  private onStreamEvent(event: ChatStreamEvent): void {
    switch (event.type) {
      case 'conversation':
        this.updateConversation(event.localId, (conversation) =>
          conversation.id === null ? { ...conversation, id: event.conversationId } : conversation,
        );
        break;
      case 'chunk':
        this.updateStreamingMessage(event.localId, (message) => ({
          ...message,
          content: message.content + event.content,
        }));
        break;
      case 'done':
        this.updateStreamingMessage(event.localId, (message) => ({
          ...message,
          status: 'complete',
        }));
        break;
      case 'error':
        this.updateStreamingMessage(event.localId, (message) => ({
          ...message,
          status: 'error',
        }));
        this.errors.update((errors) => ({ ...errors, [event.localId]: event.message }));
        break;
    }
  }
}