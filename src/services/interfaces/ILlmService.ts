
export interface ILlmService {
    initChat(address: string): Promise<void>;
    getChatHistory(address:string): Promise<any>;
    clearChat(address:string): Promise<void>;
    sendMessage(prompt: string, address: string): Promise<string | object>;
    addtxn(prompt: string, address:string, orderId?:string ): Promise<string | object>;
}
