
export interface ILlmService {
    initChat(address: string): Promise<void>;
    sendMessage(prompt: string, sessionId: string): Promise<string | object>;
}
