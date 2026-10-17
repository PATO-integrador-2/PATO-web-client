import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { ConversationService } from './conversation.service';
import { environment } from '../../../environments/environment.development';

const conversationsUrl = `${environment.apiAddr}/api/conversations`;

describe('ConversationService', () => {
  let service: ConversationService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConversationService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ConversationService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('obtiene todas las conversaciones del usuario autenticado', () => {
    service.getConversations().subscribe((conversations) => {
      expect(conversations).toEqual([{ id: 'srv-1', name: 'Conversación de prueba' }]);
    });

    const request = http.expectOne(conversationsUrl);
    expect(request.request.method).toBe('GET');
    request.flush({ conversations: [{ id: 'srv-1', name: 'Conversación de prueba' }] });
  });

  it('obtiene una conversacion por su ID', () => {
    service.getConversation('srv/1').subscribe();

    const request = http.expectOne(`${conversationsUrl}/srv%2F1/messages`);
    expect(request.request.method).toBe('GET');
    request.flush({ conversationId: 'srv/1', messages: [] });
  });

  it('elimina una conversacion por su ID', () => {
    service.deleteConversation('srv-1').subscribe();

    const request = http.expectOne(`${conversationsUrl}/srv-1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});