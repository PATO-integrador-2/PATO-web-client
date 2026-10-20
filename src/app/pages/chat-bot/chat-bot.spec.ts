import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';

import { Navbar } from '../../components/navbar/navbar';
import { ChatService } from '../../core/services/chat.service';
import { ConversationService } from '../../core/services/conversation.service';
import { ChatStreamEvent } from '../../interfaces/chat.interface';
import {
  ChatBOT,
  deriveTitle,
  normalizeConversationSearch,
  parseMarkdownTable,
} from './chat-bot';

class FakeChatService {
  readonly events$ = new Subject<ChatStreamEvent>();
  readonly state = signal('idle').asReadonly();
  sent: { localId: string; conversationId: string | null; message: string }[] = [];
  cancelCalls = 0;

  send(localId: string, conversationId: string | null, message: string): boolean {
    this.sent.push({ localId, conversationId, message });
    return true;
  }
  cancel(): void {
    this.cancelCalls++;
  }
}

class FakeConversationService {
  listCalls = 0;
  getCalls: string[] = [];
  deleteCalls: string[] = [];

  getConversations() {
    this.listCalls++;
    return of([]);
  }

  getConversation(id: string) {
    this.getCalls.push(id);
    return of({ conversationId: id });
  }

  deleteConversation(id: string) {
    this.deleteCalls.push(id);
    return of(void 0);
  }

  toChatConversation(response: { conversationId?: string }, localId: string) {
    return {
      id: response.conversationId ?? null,
      localId,
      title: 'Nueva conversación',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

describe('ChatBOT', () => {
  let fixture: ComponentFixture<ChatBOT>;
  let component: ChatBOT;
  let chat: FakeChatService;
  let conversationsApi: FakeConversationService;
  let el: HTMLElement;

  async function ask(text: string): Promise<void> {
    component.question = text;
    component.submitQuestion();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatBOT],
      providers: [
        { provide: ChatService, useClass: FakeChatService },
        { provide: ConversationService, useClass: FakeConversationService },
      ],
    })
      .overrideComponent(ChatBOT, {
        remove: { imports: [Navbar] },
        add: { schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ChatBOT);
    component = fixture.componentInstance;
    chat = TestBed.inject(ChatService) as unknown as FakeChatService;
    conversationsApi = TestBed.inject(ConversationService) as unknown as FakeConversationService;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('convierte una tabla Markdown en una tabla HTML', () => {
    const table = parseMarkdownTable(
      '| Proyecto | Descripción | Dimensión IPM |\n|---|---|---|\n| Escuelas Comunitarias | Instalación de escuelas | Educación |',
    );

    expect(table).toEqual({
      headers: ['Proyecto', 'Descripción', 'Dimensión IPM'],
      rows: [['Escuelas Comunitarias', 'Instalación de escuelas', 'Educación']],
    });
  });

  it('mantiene como texto el contenido que no es una tabla Markdown válida', () => {
    expect(parseMarkdownTable('Proyecto | Descripción')).toBeNull();
    expect(parseMarkdownTable('| Proyecto | Descripción |\n| texto | texto |')).toBeNull();
  });

  it('se crea y muestra el estado vacio sin conversaciones hardcodeadas', () => {
    expect(component).toBeTruthy();
    expect(component.conversations().length).toBe(0);
    expect(el.querySelector('.welcome-copy')).not.toBeNull();
    expect(el.querySelectorAll('.conversation-row').length).toBe(0);
  });

  it('"Nueva conversación" crea una conversacion vacia con ID nulo y clave local, y la selecciona', () => {
    (el.querySelector('.new-chat-button') as HTMLButtonElement).click();
    fixture.detectChanges();

    const [conversation] = component.conversations();
    expect(component.conversations().length).toBe(1);
    expect(conversation.id).toBeNull(); // lo crea el backend
    expect(conversation.localId).toBeTruthy();
    expect(component.activeLocalId()).toBe(conversation.localId);
    expect(el.querySelectorAll('.conversation-row').length).toBe(1);
  });

  it('no acumula conversaciones vacias al pulsar varias veces', () => {
    component.newConversation();
    component.newConversation();
    expect(component.conversations().length).toBe(1);
  });

  it('enviar crea el mensaje del usuario y un mensaje vacio del asistente en streaming', async () => {
    await ask('¿Qué es el hacinamiento crítico?');

    const [user, assistant] = component.messages();
    expect(user.role).toBe('user');
    expect(user.content).toBe('¿Qué es el hacinamiento crítico?');
    expect(assistant.role).toBe('assistant');
    expect(assistant.content).toBe('');
    expect(assistant.status).toBe('streaming');
    expect(component.isStreaming()).toBe(true);
    expect(component.question).toBe('');

    expect(el.querySelector('.message--user')?.textContent).toContain('hacinamiento');
    expect(el.querySelector('.typing')).not.toBeNull();
    expect(el.querySelector('.typing img')?.getAttribute('src')).toBe('/assets/img/gifRodrigo.gif');
    expect(el.querySelector('.typing')?.textContent).toContain('Rodrigo está pensando tu respuesta');
    expect(el.querySelector('.send-button--stop')).not.toBeNull();
  });

  it('envia conversationId null al iniciar y adopta el ID del backend para los siguientes mensajes', async () => {
    await ask('Primera pregunta. Con detalle');
    const localId = component.activeLocalId() as string;
    expect(chat.sent[0]).toEqual({ localId, conversationId: null, message: 'Primera pregunta. Con detalle' });

    chat.events$.next({ type: 'conversation', localId, conversationId: 'srv-1' });
    chat.events$.next({ type: 'done', localId });
    expect(component.activeConversation()?.id).toBe('srv-1');

    await ask('Segunda pregunta');
    expect(chat.sent[1]).toEqual({ localId, conversationId: 'srv-1', message: 'Segunda pregunta' });
    expect(component.activeConversation()?.title).toBe('Primera pregunta'); // titulo != identidad
    expect(component.activeLocalId()).toBe(localId);
  });

  it('el ID del backend es estable: un segundo ID distinto no lo sobrescribe', async () => {
    await ask('hola');
    const localId = component.activeLocalId() as string;
    chat.events$.next({ type: 'conversation', localId, conversationId: 'srv-1' });
    chat.events$.next({ type: 'conversation', localId, conversationId: 'srv-2' });

    expect(component.activeConversation()?.id).toBe('srv-1');
  });

  it('consulta el historial al seleccionar una conversacion persistida', async () => {
    await ask('hola');
    const localId = component.activeLocalId() as string;
    chat.events$.next({ type: 'conversation', localId, conversationId: 'srv-1' });
    component.activeLocalId.set(null);

    component.selectConversation(localId);

    expect(conversationsApi.getCalls).toEqual(['srv-1']);
  });

  it('sin ID devuelto por el backend, los mensajes siguientes siguen enviando null', async () => {
    await ask('uno');
    const localId = component.activeLocalId() as string;
    chat.events$.next({ type: 'done', localId });
    await ask('dos');

    expect(chat.sent.map((s) => s.conversationId)).toEqual([null, null]);
    expect(component.activeConversation()?.id).toBeNull();
  });

  it('dos conversaciones nuevas con el mismo titulo e ID nulo no se confunden', async () => {
    await ask('Misma pregunta');
    const localA = component.activeLocalId() as string;
    chat.events$.next({ type: 'done', localId: localA });
    component.activeLocalId.set(null);
    await ask('Misma pregunta');
    const localB = component.activeLocalId() as string;

    expect(localA).not.toBe(localB);
    chat.events$.next({ type: 'conversation', localId: localA, conversationId: 'srv-A' });

    const byLocal = (id: string) => component.conversations().find((c) => c.localId === id)!;
    expect(byLocal(localA).id).toBe('srv-A');
    expect(byLocal(localB).id).toBeNull();
    expect(byLocal(localA).title).toBe(byLocal(localB).title);
  });

  it('ignora el envio de texto vacio', async () => {
    await ask('   ');
    expect(chat.sent.length).toBe(0);
    expect(component.conversations().length).toBe(0);
  });

  it('filtra conversaciones por texto del titulo ignorando mayusculas y tildes', async () => {
    await ask('¿Cuál fue el IPM en Huila en 2018?');
    chat.events$.next({ type: 'done', localId: component.activeLocalId() as string });
    component.activeLocalId.set(null);
    await ask('IPM de Antioquia en 2020');

    component.searchOpen.set(true);
    component.searchQuery.set('HUILA');
    fixture.detectChanges();

    expect(component.filteredConversations().map((conversation) => conversation.title)).toEqual([
      'Cuál fue el IPM en Huila en 2018',
    ]);
    expect(el.querySelectorAll('.conversation-row')).toHaveLength(1);

    component.searchQuery.set('2018');
    expect(component.filteredConversations()).toHaveLength(1);
  });

  it('acumula varios chunks en un unico mensaje y done lo completa', async () => {
    await ask('hola');
    const id = component.activeLocalId() as string;

    chat.events$.next({ type: 'chunk', localId: id, content: 'El hacina' });
    chat.events$.next({ type: 'chunk', localId: id, content: 'miento ' });
    chat.events$.next({ type: 'chunk', localId: id, content: 'crítico' });
    fixture.detectChanges();

    expect(component.messages().length).toBe(2);
    expect(component.messages()[1].content).toBe('El hacinamiento crítico');
    expect(component.messages()[1].status).toBe('streaming');

    chat.events$.next({ type: 'done', localId: id });
    fixture.detectChanges();

    expect(component.messages()[1].status).toBe('complete');
    expect(component.isStreaming()).toBe(false);
    expect(el.querySelector('.typing')).toBeNull();
    expect(el.querySelector('.send-button--stop')).toBeNull();
  });

  it('mantiene una respuesta activa al salir y volver al modulo', async () => {
    await ask('hola');
    const localId = component.activeLocalId() as string;

    fixture.destroy();
    expect(chat.cancelCalls).toBe(0);

    chat.events$.next({ type: 'chunk', localId, content: 'Respuesta ' });
    chat.events$.next({ type: 'chunk', localId, content: 'continuada' });

    fixture = TestBed.createComponent(ChatBOT);
    fixture.detectChanges();

    expect(fixture.componentInstance.activeLocalId()).toBe(localId);
    expect(fixture.componentInstance.messages()[1].content).toBe('Respuesta continuada');
    expect(fixture.componentInstance.messages()[1].status).toBe('streaming');
  });

  it('un error muestra el mensaje y permite reintentar sin duplicar al usuario', async () => {
    await ask('hola');
    const id = component.activeLocalId() as string;
    chat.events$.next({ type: 'error', localId: id, message: 'Sin conexión' });
    fixture.detectChanges();

    expect(component.messages()[1].status).toBe('error');
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Sin conexión');
    expect(component.isStreaming()).toBe(false);

    (el.querySelector('.retry-button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(component.messages().length).toBe(2);
    expect(component.messages().filter((m) => m.role === 'user').length).toBe(1);
    expect(component.messages()[1].status).toBe('streaming');
    expect(chat.sent.length).toBe(2);
    expect(chat.sent[1]).toEqual({ localId: id, conversationId: null, message: 'hola' });
    expect(component.activeError()).toBeNull();
  });

  it('cancelar cierra el socket y marca el mensaje como cancelado', async () => {
    await ask('hola');
    chat.events$.next({
      type: 'chunk',
      localId: component.activeLocalId() as string,
      content: 'parcial',
    });

    component.cancelResponse();
    fixture.detectChanges();

    expect(chat.cancelCalls).toBe(1);
    expect(component.messages()[1].status).toBe('cancelled');
    expect(component.messages()[1].content).toBe('parcial');
    expect(component.isStreaming()).toBe(false);
    expect(el.querySelector('.retry-button')).not.toBeNull();
  });

  it('un chunk tardio tras cancelar no modifica el mensaje', async () => {
    await ask('hola');
    const id = component.activeLocalId() as string;
    component.cancelResponse();
    chat.events$.next({ type: 'chunk', localId: id, content: 'tarde' });

    expect(component.messages()[1].content).toBe('');
  });

  it('seleccionar otra conversacion cancela el stream y no mezcla mensajes', async () => {
    await ask('pregunta A');
    const idA = component.activeLocalId() as string;
    component.question = '';
    component.activeLocalId.set(null);
    await ask('pregunta B');
    const idB = component.activeLocalId() as string;
    expect(idA).not.toBe(idB);

    component.selectConversation(idA);
    fixture.detectChanges();

    expect(chat.cancelCalls).toBe(1);
    expect(component.activeLocalId()).toBe(idA);
    expect(component.messages()[0].content).toBe('pregunta A');
    expect(component.messages().some((m) => m.content === 'pregunta B')).toBe(false);
  });

  it('los eventos se aplican a su conversacion de origen, no a la activa', async () => {
    await ask('pregunta A');
    const idA = component.activeLocalId() as string;
    chat.events$.next({ type: 'done', localId: idA });
    component.activeLocalId.set(null);
    await ask('pregunta B');

    chat.events$.next({ type: 'chunk', localId: idA, content: 'no debe aplicarse' });

    const b = component.conversations().find((c) => c.localId !== idA);
    expect(b?.messages[1].content).toBe('');
  });

  it('eliminar pide confirmacion, borra la conversacion y selecciona otra', async () => {
    await ask('uno');
    const idUno = component.activeLocalId() as string;
    chat.events$.next({ type: 'done', localId: idUno });
    component.activeLocalId.set(null);
    await ask('dos');
    const idDos = component.activeLocalId() as string;
    chat.events$.next({ type: 'done', localId: idDos });

    (el.querySelector('.delete-conversation-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelector('.delete-modal')).not.toBeNull();

    component.cancelConversationDeletion();
    fixture.detectChanges();
    expect(component.conversations().length).toBe(2);

    component.requestConversationDeletion(component.conversations().find((c) => c.localId === idDos)!);
    component.confirmConversationDeletion();
    fixture.detectChanges();

    expect(component.conversations().length).toBe(1);
    expect(component.activeLocalId()).toBe(idUno);
    expect(el.querySelector('.delete-modal')).toBeNull();
  });

  it('eliminar la ultima conversacion vuelve al estado vacio', async () => {
    await ask('uno');
    component.requestConversationDeletion(component.activeConversation()!);
    component.confirmConversationDeletion();
    fixture.detectChanges();

    expect(chat.cancelCalls).toBe(1); // estaba en streaming
    expect(component.activeLocalId()).toBeNull();
    expect(el.querySelector('.welcome-copy')).not.toBeNull();
  });

  it('eliminar una conversacion persistida llama al endpoint DELETE', async () => {
    await ask('uno');
    const localId = component.activeLocalId() as string;
    chat.events$.next({ type: 'conversation', localId, conversationId: 'srv-1' });

    component.requestConversationDeletion(component.activeConversation()!);
    component.confirmConversationDeletion();

    expect(conversationsApi.deleteCalls).toEqual(['srv-1']);
    expect(component.conversations()).toHaveLength(0);
  });

  it('cierra el socket al destruirse', () => {
    fixture.destroy();
    expect(chat.cancelCalls).toBe(1);
  });
});

describe('deriveTitle', () => {
  it('usa la primera frase sin signos de apertura', () => {
    expect(deriveTitle('¿Qué es el hacinamiento crítico? Explícalo')).toBe('Qué es el hacinamiento crítico');
  });
  it('trunca titulos largos', () => {
    expect(deriveTitle('a'.repeat(100)).length).toBe(48);
  });
});

describe('normalizeConversationSearch', () => {
  it('elimina tildes y espacios externos', () => {
    expect(normalizeConversationSearch('  HÚILA  ')).toBe('huila');
  });
});