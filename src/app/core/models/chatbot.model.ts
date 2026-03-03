export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export interface ChatRequest {
    message: string;
    context?: {
        userId?: number;
        userName?: string;
        userRole?: boolean;
    };
}

export interface ChatResponse {
    message: string;
    action?: {
        type: 'navigate' | 'create' | 'search';
        payload: any;
    };
}
