import { controller, httpPost, request } from "inversify-express-utils";
import { inject } from "inversify";
import { TYPES } from "../ioc-container/types";
import { type Request } from "express";
import { LlmService } from "../services/LlmService";
import AuthMiddleware from "../middleware/AuthMiddleware";

@controller('/llm',)
export class LlmController {
    constructor(@inject(TYPES.LlmService) private llmService: LlmService) {}

     @httpPost('/chat')
    private async chat(@request() req: Request<unknown, unknown, { prompt: string, sessionId: string }>): Promise<string | object> {
        const { prompt, sessionId } = req.body;
        return this.llmService.startChat(prompt, sessionId);
    }
}
