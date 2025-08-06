
export interface ILlmService {
    initChat(address: string): Promise<void>;
    sendMessage(prompt: string, address: string): Promise<string | object>;
    addtxn(prompt: string, address:string ): Promise<string | object>;
}
