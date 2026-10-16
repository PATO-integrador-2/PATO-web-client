import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment.development';
import { ChatConversation } from '../../interfaces/chat.interface';

export interface ConversationResponse {
  conversationId?: string;
  conversation_id?: string;
  id?: string;
  title?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  messages?: ConversationMessageResponse[];
  conversation?: ConversationResponse;
  data?: ConversationResponse;
}

export interface ConversationMessageResponse {
  id?: string;
  role?: 'user' | 'assistant';
  content?: string;
  message?: string;
  createdAt?: string;
  created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class ConversationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiAddr}/api/conversations`;

  getConversation(conversationId: string): Observable<ConversationResponse> {
    return this.http.get<ConversationResponse>(`${this.apiUrl}/${encodeURIComponent(conversationId)}`);
  }

  deleteConversation(conversationId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${encodeURIComponent(conversationId)}`);
  }

  toChatConversation(response: ConversationResponse, localId: string): ChatConversation {
    const source = response.conversation ?? response.data ?? response;
    const id = source.conversationId ?? source.conversation_id ?? source.id ?? null;
    const messages = (source.messages ?? [])
      .filter((message) => message.role === 'user' || message.role === 'assistant')
      .map((message, index) => ({
        id: message.id ?? `${localId}-message-${index}`,
        role: message.role as 'user' | 'assistant',
        content: message.content ?? message.message ?? '',
        createdAt: message.createdAt ?? message.created_at ?? new Date().toISOString(),
        status: 'complete' as const,
      }));
    const now = new Date().toISOString();

    return {
      id,
      localId,
      title: source.title ?? messages.find((message) => message.role === 'user')?.content ?? 'Nueva conversación',
      messages,
      createdAt: source.createdAt ?? source.created_at ?? now,
      updatedAt: source.updatedAt ?? source.updated_at ?? now,
    };
  }
}