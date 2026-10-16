import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment.development';
import { ConversationService } from './conversation.service';

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

  it('obtiene una conversacion por su ID', () => {
    service.getConversation('srv/1').subscribe();

    const request = http.expectOne(`${environment.apiAddr}/api/conversations/srv%2F1`);
    expect(request.request.method).toBe('GET');
    request.flush({ conversationId: 'srv/1', messages: [] });
  });

  it('elimina una conversacion por su ID', () => {
    service.deleteConversation('srv-1').subscribe();

    const request = http.expectOne(`${environment.apiAddr}/api/conversations/srv-1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});