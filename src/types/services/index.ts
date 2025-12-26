export interface ChatRequest {
    question: string;
}

export interface ChatResponse {
    content: string;
    timestamp: string;
    status: string;
}
