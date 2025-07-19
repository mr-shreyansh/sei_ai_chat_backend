
export interface ILlmService {
    initChat(sessionId?: string): Promise<{ sessionId: string }>;
    sendMessage(prompt: string, sessionId: string): Promise<string | object>;
}
