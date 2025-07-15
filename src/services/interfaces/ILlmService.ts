export interface ILlmService {
    startChat(prompt: string, sessionId:string): Promise<string | object>;
}
