import { Injectable, InjectionToken, OnDestroy, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject } from 'rxjs';

import { environment } from '../../../environments/environment.development';
import {
  ChatConnectionState,
  ChatSendPayload,
  ChatStreamEvent,
  ChatWireEvent,
} from '../../interfaces/chat.interface';

/** Subconjunto de la API WebSocket que usa el servicio (facilita tests con un fake). */
export interface ChatSocketLike {
  readyState: number;
  onopen: ((ev: unknown) => void) | null;
  onmessage: ((ev: { data: unknown }) => void) | null;
  onerror: ((ev: unknown) => void) | null;
  onclose: ((ev: unknown) => void) | null;
  send(data: string): void;
  close(code?: number, reason?: string): void;
}

export type ChatSocketFactory = (url: string) => ChatSocketLike;

/** Permite reemplazar la creacion del WebSocket en tests. */
export const CHAT_SOCKET_FACTORY = new InjectionToken<ChatSocketFactory>('CHAT_SOCKET_FACTORY', {
  providedIn: 'root',
  factory: () => (url: string) => new WebSocket(url) as unknown as ChatSocketLike,
});

export const CHAT_WS_PATH = '/api/users/chat/ws';
export const AUTH_TOKEN_KEY = 'authToken';
const TEMPORARY_CONVERSATION_ID = 'test-postman';
const WS_OPEN = 1;

/**
 * Construye la URL del WebSocket derivandola de `apiAddr`:
 *   http://host  -> ws://host
 *   https://host -> wss://host   (evita mixed content bajo HTTPS)
 *
 * SEGURIDAD: el JWT viaja en query string porque es el contrato probado. Puede
 * quedar en logs de proxies/herramientas de red. Evaluar con backend una
 * alternativa (cookie HttpOnly, subprotocolo o primer mensaje). Esta URL nunca
 * debe imprimirse.
 */
export function buildChatWsUrl(apiAddr: string, token: string): string {
  const base = apiAddr.replace(/\/+$/, '').replace(/^http(s?):\/\//i, (_m, s) => `ws${s}://`);
  return `${base}${CHAT_WS_PATH}?token=${encodeURIComponent(token)}`;
}

/**
 * UNICO punto que interpreta como devuelve el backend el ID de conversacion.
 * SUPUESTO NO CONFIRMADO: campo string `conversationId` en cualquier evento.
 * Si el backend usa otra forma (evento dedicado, otro nombre de campo), cambiar solo esto.
 */
export function extractBackendConversationId(event: ChatWireEvent): string | null {
  const id = (event as { conversationId?: unknown }).conversationId;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

/**
 * Base del WebSocket. Si el entorno define `wsAddr` (p. ej. 'wss://pato.bucaramanga.upb.edu.co')
 * se usa tal cual; si no, se deriva de `apiAddr`.
 */
export function resolveChatWsBase(env: { apiAddr: string; wsAddr?: string }): string {
  return env.wsAddr?.trim() || env.apiAddr;
}

/** True si una pagina HTTPS intentaria abrir un `ws://` (el navegador lo bloquea). */
export function isMixedContent(pageProtocol: string, wsUrl: string): boolean {
  return pageProtocol === 'https:' && /^ws:\/\//i.test(wsUrl);
}

@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly socketFactory = inject(CHAT_SOCKET_FACTORY);

  private readonly _state = signal<ChatConnectionState>('idle');
  private readonly _error = signal<string | null>(null);
  private readonly eventsSubject = new Subject<ChatStreamEvent>();

  readonly state = this._state.asReadonly();
  readonly error = this._error.asReadonly();
  readonly events$ = this.eventsSubject.asObservable();

  private socket: ChatSocketLike | null = null;
  /** Se incrementa al cerrar/reemplazar un socket: invalida callbacks viejos. */
  private generation = 0;
  /** Clave local de la conversacion con respuesta en curso. */
  private inFlightLocalId: string | null = null;
  /** ID de backend enviado en la solicitud en curso (null = conversacion nueva). */
  private sentConversationId: string | null = null;
  /** ID de backend ya anunciado al componente para la solicitud en curso. */
  private announcedConversationId: string | null = null;

  get isBusy(): boolean {
    const s = this._state();
    return s === 'connecting' || s === 'streaming';
  }

  /**
   * Envia una pregunta. Abre el socket si hace falta o reutiliza el abierto.
   *
   * @param localId        clave local de la conversacion (solo UI; no se envia).
   * @param conversationId ID creado por el backend, o `null` para iniciar una conversacion nueva.
   * @returns false si no se pudo iniciar el envio (el motivo llega por `events$` y `error`,
   *          salvo cuando ya hay una respuesta en curso o el texto es vacio).
   */
  send(localId: string, conversationId: string | null, message: string): boolean {
    const text = message.trim();
    if (!text || this.isBusy) {
      return false;
    }
    if (!this.isBrowser) {
      this.fail(localId, 'El chat solo está disponible en el navegador.');
      return false;
    }
    const token = this.readToken();
    if (!token) {
      this.fail(localId, 'Tu sesión no es válida. Inicia sesión de nuevo.');
      return false;
    }

    const payload: ChatSendPayload = {
      conversationId: TEMPORARY_CONVERSATION_ID,
      message: text,
    };
    this.inFlightLocalId = localId;
    this.sentConversationId = conversationId;
    this.announcedConversationId = null;
    this._error.set(null);

    if (this.socket && this.socket.readyState === WS_OPEN) {
      this.transmit(localId, payload);
      return true;
    }

    this.openSocket(token, localId, payload);
    return true;
  }

  /** Cancela la respuesta activa y cierra el socket. Los eventos tardios se ignoran. */
  cancel(): void {
    this.closeSocket();
    this.inFlightLocalId = null;
    this._state.set('closed');
  }

  ngOnDestroy(): void {
    this.closeSocket();
    this.eventsSubject.complete();
  }

  // ---------------------------------------------------------------- privado

  private openSocket(token: string, localId: string, payload: ChatSendPayload): void {
    this.closeSocket();
    const gen = this.generation;
    this._state.set('connecting');

    const env: { apiAddr: string; wsAddr?: string } = environment;
    const url = buildChatWsUrl(resolveChatWsBase(env), token);
    if (isMixedContent(globalThis.location?.protocol ?? '', url)) {
      this.fail(localId, 'La conexión del chat debe usar wss:// cuando la página se sirve por HTTPS.');
      return;
    }

    let socket: ChatSocketLike;
    try {
      socket = this.socketFactory(url);
    } catch {
      this.fail(localId, 'No se pudo iniciar la conexión con el asistente.');
      return;
    }
    this.socket = socket;

    socket.onopen = () => {
      if (gen !== this.generation) return;
      this._state.set('open');
      this.transmit(localId, payload);
    };
    socket.onmessage = (ev) => {
      if (gen !== this.generation) return;
      this.handleFrame(ev.data);
    };
    socket.onerror = () => {
      if (gen !== this.generation) return;
      this.fail(localId, 'Error de conexión con el asistente.');
    };
    socket.onclose = () => {
      if (gen !== this.generation) return;
      this.socket = null;
      if (this.isBusy) {
        this.fail(localId, 'La conexión se cerró antes de terminar la respuesta.');
      } else {
        this._state.set('closed');
      }
    };
  }

  private transmit(localId: string, payload: ChatSendPayload): void {
    try {
      this.socket?.send(JSON.stringify(payload));
      this._state.set('streaming');
    } catch {
      this.fail(localId, 'No se pudo enviar el mensaje. Intenta de nuevo.');
    }
  }

  private handleFrame(raw: unknown): void {
    const localId = this.inFlightLocalId;
    if (!localId || typeof raw !== 'string') return;

    let event: ChatWireEvent;
    try {
      event = JSON.parse(raw) as ChatWireEvent;
    } catch {
      // Frame no JSON: se ignora sin registrar su contenido.
      return;
    }
    if (!event || typeof event !== 'object') return;

    this.announceConversationId(localId, extractBackendConversationId(event));

    switch (event.type) {
      case 'chunk': {
        const content = typeof event.content === 'string' ? event.content : '';
        if (content) {
          this.eventsSubject.next({ type: 'chunk', localId, content });
        }
        break;
      }
      case 'done':
        this.inFlightLocalId = null;
        this._state.set('completed');
        this.eventsSubject.next({ type: 'done', localId });
        break;
      case 'error': {
        const message =
          typeof event.message === 'string' && event.message
            ? event.message
            : 'El asistente no pudo responder.';
        this.fail(localId, message);
        break;
      }
      default:
        break; // tipos desconocidos: se ignoran
    }
  }

  /** Avisa al componente (una sola vez por solicitud) del ID asignado por el backend. */
  private announceConversationId(localId: string, backendId: string | null): void {
    if (
      !backendId ||
      backendId === this.sentConversationId ||
      backendId === this.announcedConversationId
    ) {
      return;
    }
    this.announcedConversationId = backendId;
    this.eventsSubject.next({ type: 'conversation', localId, conversationId: backendId });
  }

  private fail(localId: string, message: string): void {
    this.closeSocket();
    this.inFlightLocalId = null;
    this._error.set(message);
    this._state.set('error');
    this.eventsSubject.next({ type: 'error', localId, message });
  }

  private closeSocket(): void {
    this.generation++;
    const socket = this.socket;
    this.socket = null;
    if (socket) {
      socket.onopen = socket.onmessage = socket.onerror = socket.onclose = null;
      try {
        socket.close(1000);
      } catch {
        /* ya cerrado */
      }
    }
  }

  private readToken(): string | null {
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  }
}