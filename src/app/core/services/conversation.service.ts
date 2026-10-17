import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { ChatConversation } from '../../interfaces/chat.interface';
import { environment } from '../../../environments/environment.development';

export type ConversationListResponse =
  | ConversationResponse[]
  | { conversations?: ConversationResponse[]; data?: ConversationResponse[] };

export interface ConversationResponse {
  conversationId?: string;
  conversation_id?: string;
  id?: string;
  title?: string;
  name?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  last_used_at?: string;
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

  getConversations(): Observable<ConversationResponse[]> {
    return this.http.get<ConversationListResponse>(this.apiUrl).pipe(
      map((response) => (Array.isArray(response) ? response : response.conversations ?? response.data ?? [])),
    );
  }

  getConversation(conversationId: string): Observable<ConversationResponse> {
    return this.http.get<ConversationResponse>(
      `${this.apiUrl}/${encodeURIComponent(conversationId)}/messages`,
    );
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
      title:
        source.title ??
        source.name ??
        messages.find((message) => message.role === 'user')?.content ??
        'Nueva conversación',
      messages,
      createdAt: source.createdAt ?? source.created_at ?? now,
      updatedAt: source.updatedAt ?? source.updated_at ?? source.last_used_at ?? now,
    };
  }
}