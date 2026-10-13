import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  CHAT_SOCKET_FACTORY,
  ChatService,
  ChatSocketLike,
  buildChatWsUrl,
  extractBackendConversationId,
  isMixedContent,
  resolveChatWsBase,
} from './chat.service';
import { ChatStreamEvent } from '../../interfaces/chat.interface';

class FakeSocket implements ChatSocketLike {
  readyState = 0;
  onopen: ((ev: unknown) => void) | null = null;
  onmessage: ((ev: { data: unknown }) => void) | null = null;
  onerror: ((ev: unknown) => void) | null = null;
  onclose: ((ev: unknown) => void) | null = null;
  sent: string[] = [];
  closed = false;

  constructor(readonly url: string) {}

  send(data: string): void {
    this.sent.push(data);
  }
  close(): void {
    this.closed = true;
    this.readyState = 3;
  }
  // helpers de test
  open(): void {
    this.readyState = 1;
    this.onopen?.({});
  }
  receive(data: unknown): void {
    this.onmessage?.({ data: typeof data === 'string' ? data : JSON.stringify(data) });
  }
}

describe('buildChatWsUrl', () => {
  it('convierte http en ws y https en wss', () => {
    expect(buildChatWsUrl('http://host:8080', 't')).toBe('ws://host:8080/api/users/chat/ws?token=t');
    expect(buildChatWsUrl('https://host/', 't')).toBe('wss://host/api/users/chat/ws?token=t');
  });

  it('produce la URL de produccion (wss, sin puerto) y conserva tokens base64url', () => {
    expect(buildChatWsUrl('https://pato.bucaramanga.upb.edu.co', 'abc-DEF_123')).toBe(
      'wss://pato.bucaramanga.upb.edu.co/api/users/chat/ws?token=abc-DEF_123',
    );
  });

  it('no altera una base que ya es wss://', () => {
    expect(buildChatWsUrl('wss://pato.bucaramanga.upb.edu.co', 't')).toBe(
      'wss://pato.bucaramanga.upb.edu.co/api/users/chat/ws?token=t',
    );
  });

  it('wsAddr tiene prioridad sobre apiAddr; sin wsAddr se deriva de apiAddr', () => {
    expect(resolveChatWsBase({ apiAddr: 'http://100.121.122.13:8080', wsAddr: 'wss://h' })).toBe('wss://h');
    expect(resolveChatWsBase({ apiAddr: 'http://100.121.122.13:8080', wsAddr: ' ' })).toBe(
      'http://100.121.122.13:8080',
    );
  });

  it('detecta mixed content solo para ws:// bajo una pagina https', () => {
    expect(isMixedContent('https:', 'ws://host/x')).toBe(true);
    expect(isMixedContent('https:', 'wss://host/x')).toBe(false);
    expect(isMixedContent('http:', 'ws://host/x')).toBe(false);
  });

  it('codifica el token con encodeURIComponent', () => {
    expect(buildChatWsUrl('http://h', 'a b+c/d=')).toContain('token=a%20b%2Bc%2Fd%3D');
  });
});

describe('ChatService', () => {
  let sockets: FakeSocket[];
  let events: ChatStreamEvent[];

  function setup(platform: 'browser' | 'server' = 'browser'): ChatService {
    sockets = [];
    events = [];
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: platform },
        {
          provide: CHAT_SOCKET_FACTORY,
          useValue: (url: string) => {
            const s = new FakeSocket(url);
            sockets.push(s);
            return s;
          },
        },
      ],
    });
    const service = TestBed.inject(ChatService);
    service.events$.subscribe((e) => events.push(e));
    return service;
  }

  beforeEach(() => localStorage.setItem('authToken', 'jwt token/1'));
  afterEach(() => localStorage.removeItem('authToken'));

  it('abre el socket con el token codificado y envia el payload al abrir', () => {
    const service = setup();
    expect(service.send('local-1', null, '¿Qué es el hacinamiento crítico?')).toBe(true);

    expect(sockets.length).toBe(1);
    expect(sockets[0].url).toContain('/api/users/chat/ws?token=jwt%20token%2F1');
    expect(service.state()).toBe('connecting');
    expect(sockets[0].sent.length).toBe(0);

    sockets[0].open();
    expect(service.state()).toBe('streaming');
    expect(JSON.parse(sockets[0].sent[0])).toEqual({
      conversationId: null,
      message: '¿Qué es el hacinamiento crítico?',
    });
    expect(sockets[0].sent[0]).not.toContain('local-1');
  });

  it('envia el conversationId recibido', () => {
    const service = setup();
    service.send('local-1', 'srv-42', '¿Cómo se mide?');
    sockets[0].open();

    expect(JSON.parse(sockets[0].sent[0])).toEqual({
      conversationId: 'srv-42',
      message: '¿Cómo se mide?',
    });
  });

  it('emite cada chunk asociado a su conversacion y finaliza con done', () => {
    const service = setup();
    service.send('local-1', null, 'hola');
    sockets[0].open();

    sockets[0].receive({ type: 'chunk', content: 'El hacina' });
    sockets[0].receive({ type: 'chunk', content: 'miento' });
    sockets[0].receive({ type: 'done' });

    expect(events).toEqual([
      { type: 'chunk', localId: 'local-1', content: 'El hacina' },
      { type: 'chunk', localId: 'local-1', content: 'miento' },
      { type: 'done', localId: 'local-1' },
    ]);
    expect(service.state()).toBe('completed');
    expect(service.isBusy).toBe(false);
  });

  it('reutiliza el socket abierto para una segunda pregunta', () => {
    const service = setup();
    service.send('local-1', null, 'uno');
    sockets[0].open();
    sockets[0].receive({ type: 'done' });

    service.send('local-1', null, 'dos');
    expect(sockets.length).toBe(1);
    expect(sockets[0].sent.length).toBe(2);
    expect(JSON.parse(sockets[0].sent[1]).message).toBe('dos');
  });

  it('ignora el envio vacio y el envio mientras hay una respuesta en curso', () => {
    const service = setup();
    expect(service.send('c', null, '   ')).toBe(false);
    expect(service.send('c', null, 'uno')).toBe(true);
    expect(service.send('c', null, 'dos')).toBe(false);
    expect(sockets.length).toBe(1);
  });

  it('ignora JSON invalido, chunks sin content y tipos desconocidos', () => {
    const service = setup();
    service.send('c', null, 'hola');
    sockets[0].open();

    sockets[0].receive('{no es json');
    sockets[0].receive({ type: 'chunk' });
    sockets[0].receive({ type: 'otro' });

    expect(events.length).toBe(0);
    expect(service.state()).toBe('streaming');
  });

  it('anuncia el ID del backend una sola vez, antes del contenido que lo trae', () => {
    const service = setup();
    service.send('local-1', null, 'hola');
    sockets[0].open();

    sockets[0].receive({ type: 'chunk', content: 'a', conversationId: 'srv-1' });
    sockets[0].receive({ type: 'chunk', content: 'b', conversationId: 'srv-1' });
    sockets[0].receive({ type: 'done', conversationId: 'srv-1' });

    expect(events).toEqual([
      { type: 'conversation', localId: 'local-1', conversationId: 'srv-1' },
      { type: 'chunk', localId: 'local-1', content: 'a' },
      { type: 'chunk', localId: 'local-1', content: 'b' },
      { type: 'done', localId: 'local-1' },
    ]);
  });

  it('anuncia el ID cuando solo llega en el evento done', () => {
    const service = setup();
    service.send('local-1', null, 'hola');
    sockets[0].open();
    sockets[0].receive({ type: 'chunk', content: 'a' });
    sockets[0].receive({ type: 'done', conversationId: 'srv-9' });

    expect(events.map((e) => e.type)).toEqual(['chunk', 'conversation', 'done']);
  });

  it('no anuncia nada si el backend devuelve el mismo ID que se envio o ninguno', () => {
    const service = setup();
    service.send('local-1', 'srv-1', 'hola');
    sockets[0].open();
    sockets[0].receive({ type: 'chunk', content: 'a', conversationId: 'srv-1' });
    sockets[0].receive({ type: 'done' });

    expect(events.some((e) => e.type === 'conversation')).toBe(false);
  });

  it('ignora conversationId que no sea un string no vacio', () => {
    expect(extractBackendConversationId({ type: 'done', conversationId: '' })).toBeNull();
    expect(extractBackendConversationId({ type: 'done' })).toBeNull();
    expect(
      extractBackendConversationId({ type: 'done', conversationId: 5 as unknown as string }),
    ).toBeNull();
    expect(extractBackendConversationId({ type: 'done', conversationId: 'x' })).toBe('x');
  });

  it('un evento error del backend deja el servicio en error y cierra el socket', () => {
    const service = setup();
    service.send('c', null, 'hola');
    sockets[0].open();
    sockets[0].receive({ type: 'error', message: 'Modelo no disponible' });

    expect(events).toEqual([{ type: 'error', localId: 'c', message: 'Modelo no disponible' }]);
    expect(service.state()).toBe('error');
    expect(service.error()).toBe('Modelo no disponible');
    expect(sockets[0].closed).toBe(true);
  });

  it('un error del socket emite un evento error y no bloquea nuevos envios', () => {
    const service = setup();
    service.send('c', null, 'hola');
    sockets[0].onerror?.({});

    expect(events[0].type).toBe('error');
    expect(service.isBusy).toBe(false);
    expect(service.send('c', null, 'otra vez')).toBe(true);
    expect(sockets.length).toBe(2);
  });

  it('el cierre inesperado durante el streaming es un error', () => {
    const service = setup();
    service.send('c', null, 'hola');
    sockets[0].open();
    sockets[0].onclose?.({});

    expect(events[0].type).toBe('error');
    expect(service.state()).toBe('error');
  });

  it('cancel cierra el socket e ignora eventos tardios', () => {
    const service = setup();
    service.send('c', null, 'hola');
    const socket = sockets[0];
    socket.open();
    const lateHandler = socket.onmessage;

    service.cancel();
    expect(socket.closed).toBe(true);
    expect(service.state()).toBe('closed');

    lateHandler?.({ data: JSON.stringify({ type: 'chunk', content: 'tarde' }) });
    expect(events.length).toBe(0);
  });

  it('sin token no abre socket y emite error', () => {
    localStorage.removeItem('authToken');
    const service = setup();
    expect(service.send('c', null, 'hola')).toBe(false);
    expect(sockets.length).toBe(0);
    expect(events[0].type).toBe('error');
  });

  it('en SSR no abre el socket', () => {
    const service = setup('server');
    expect(service.send('c', null, 'hola')).toBe(false);
    expect(sockets.length).toBe(0);
    expect(service.state()).toBe('error');
  });
});