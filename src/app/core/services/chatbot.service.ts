import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChatRequest, ChatResponse } from '../models/chatbot.model';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class ChatbotService {
    private http = inject(HttpClient);
    private storage = inject(StorageService);
    private apiUrl = 'http://localhost:8080/api/chatbot';

    sendMessage(message: string): Observable<ChatResponse> {
        const user = this.getCurrentUser();
        
        const request: ChatRequest = {
            message,
            context: user ? {
                userId: user.id_trabajador,
                userName: user.nombre || user.usuario,
                userRole: user.rol
            } : undefined
        };

        return this.http.post<ChatResponse>(`${this.apiUrl}/message`, request);
    }

    private getCurrentUser(): any {
        const raw = this.storage.getItem('currentUser');
        return raw ? JSON.parse(raw) : null;
    }
}
