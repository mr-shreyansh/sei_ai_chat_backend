
export interface ILlmService {
    initChat(address: string): Promise<void>;
    getChatHistory(address:string): Promise<any>;
    sendMessage(prompt: string, address: string): Promise<string | object>;
    addtxn(prompt: string, address:string, orderId?:string ): Promise<string | object>;
}
