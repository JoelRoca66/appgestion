import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { TooltipModule } from 'primeng/tooltip';
import { ChatbotService } from '../../../core/services/chatbot.service';
import { ChatMessage } from '../../../core/models/chatbot.model';
import { ReplaceNewlinesPipe } from '../../pipes/replace-newlines.pipe';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'app-chatbot',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        InputTextModule,
        ScrollPanelModule,
        TooltipModule,
        ReplaceNewlinesPipe
    ],
    templateUrl: './chatbot.component.html',
    styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent {
    private chatbotService = inject(ChatbotService);
    private router = inject(Router);

    isOpen = signal(false);
    messages = signal<ChatMessage[]>([]);
    userInput = '';
    isTyping = signal(false);

    toggleChat() {
        this.isOpen.set(!this.isOpen());
        if (this.isOpen() && this.messages().length === 0) {
            this.addWelcomeMessage();
        }
    }

    private addWelcomeMessage() {
        this.messages.update(msgs => [...msgs, {
            role: 'assistant',
            content: '¡Hola! Soy tu asistente virtual. Puedo ayudarte con:\n\n• Consultar tus tareas y proyectos\n• Buscar información específica\n• Crear nuevas tareas rápidamente\n• Responder preguntas sobre el estado de tu trabajo\n\n¿En qué puedo ayudarte?',
            timestamp: new Date()
        }]);
    }

    sendMessage() {
        const message = this.userInput.trim();
        if (!message || this.isTyping()) return;

        this.messages.update(msgs => [...msgs, {
            role: 'user',
            content: message,
            timestamp: new Date()
        }]);

        this.userInput = '';
        this.isTyping.set(true);

        this.chatbotService.sendMessage(message)
            .pipe(finalize(() => this.isTyping.set(false)))
            .subscribe({
                next: (response) => {
                    this.messages.update(msgs => [...msgs, {
                        role: 'assistant',
                        content: response.message,
                        timestamp: new Date()
                    }]);
                    if (response.action) {
                        this.handleAction(response.action);
                    }
                    setTimeout(() => this.scrollToBottom(), 100);
                },
                error: (err) => {
                    console.error('Error chat:', err);
                    const errorMsg = err.status === 0 
                        ? '❌ No se pudo conectar al servidor. Asegúrate de que el backend esté corriendo en http://localhost:8080'
                        : `❌ Error: ${err.error?.message || 'Error al procesar tu mensaje'}`;
                    
                    this.messages.update(msgs => [...msgs, {
                        role: 'assistant',
                        content: errorMsg,
                        timestamp: new Date()
                    }]);
                }
            });
    }

    private handleAction(action: any) {
        if (!action) return;
        
        switch (action.type) {
            case 'navigate':
                setTimeout(() => {
                    this.router.navigate([action.payload]);
                    this.isOpen.set(false);
                }, 500);
                break;
                
            case 'create':
                const createRoute = action.payload?.entity || 'tareas';
                this.router.navigate([`/user/${createRoute}`]);
                setTimeout(() => this.isOpen.set(false), 500);
                break;
                
            case 'search':
                if (action.payload?.term) {
                    this.router.navigate(['/user/tareas'], { 
                        queryParams: { search: action.payload.term } 
                    });
                    setTimeout(() => this.isOpen.set(false), 500);
                }
                break;
        }
    }

    private scrollToBottom() {
        const chatBody = document.querySelector('.chat-messages');
        if (chatBody) {
            chatBody.scrollTop = chatBody.scrollHeight;
        }
    }

    clearChat() {
        this.messages.set([]);
        this.addWelcomeMessage();
    }

    onKeyPress(event: KeyboardEvent) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }
}
