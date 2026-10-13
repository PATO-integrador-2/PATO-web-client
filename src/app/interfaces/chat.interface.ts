/**
 * Tipos de dominio del chatbot.
 *
 * El contrato de red (ChatSendPayload / ChatWireEvent) refleja lo confirmado con
 * Postman. Lo NO confirmado esta marcado como SUPUESTO y el parser lo trata de
 * forma tolerante.
 */

export type ChatRole = 'user' | 'assistant';

export type ChatMessageStatus = 'complete' | 'streaming' | 'error' | 'cancelled';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  status: ChatMessageStatus;
}

export interface ChatConversation {
  /**
   * ID de conversacion creado por el BACKEND. Es `null` hasta que el backend lo
   * devuelva (o si la conversacion aun no tuvo respuesta). Nunca se deriva del titulo.
   */
  id: string | null;
  /**
   * Clave local, exclusiva del frontend, para seleccionar, trackear y enrutar eventos
   * mientras `id` es null. NUNCA se envia al backend.
   */
  localId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

/** Mensaje que el cliente envia por el WebSocket. `null` inicia una conversacion nueva. */
export interface ChatSendPayload {
  conversationId: string | null;
  message: string;
}

/**
 * SUPUESTO NO CONFIRMADO: el backend podria devolver el ID creado en un campo
 * `conversationId` de cualquier evento (chunk, done u otro). Si el contrato real es
 * distinto, el unico punto a cambiar es `extractBackendConversationId` en ChatService.
 */
interface ChatWireBase {
  conversationId?: string;
}
export interface ChatChunkWireEvent extends ChatWireBase {
  type: 'chunk';
  content?: string;
}
export interface ChatDoneWireEvent extends ChatWireBase {
  type: 'done';
}
export interface ChatErrorWireEvent extends ChatWireBase {
  type: 'error';
  message?: string;
}
export type ChatWireEvent = ChatChunkWireEvent | ChatDoneWireEvent | ChatErrorWireEvent;

/** Eventos que el servicio expone al componente, asociados a la clave local de la conversacion. */
export type ChatStreamEvent =
  | { type: 'conversation'; localId: string; conversationId: string }
  | { type: 'chunk'; localId: string; content: string }
  | { type: 'done'; localId: string }
  | { type: 'error'; localId: string; message: string };

export type ChatConnectionState =
  | 'idle'
  | 'connecting'
  | 'open'
  | 'streaming'
  | 'completed'
  | 'error'
  | 'closed';