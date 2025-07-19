import { controller, httpPost, request } from "inversify-express-utils";
import { inject } from "inversify";
import { TYPES } from "../ioc-container/types";
import { type Request } from "express";
import { ILlmService } from "../services/interfaces/ILlmService";
import AuthMiddleware from "../middleware/AuthMiddleware";

@controller("/llm")
export class LlmController {
  constructor(@inject(TYPES.LlmService) private llmService: ILlmService) {}

  @httpPost("/init")
  private async init(
    @request() req: Request<unknown, unknown, { sessionId: string | null }>
  ): Promise<{ success: boolean; sessionId: string }> {
    const { sessionId } = req.body;
    const response = await this.llmService.initChat(sessionId);
    return { success: true, sessionId: response.sessionId };
  }

  @httpPost("/chat")
  private async chat(
    @request()
    req: Request<unknown, unknown, { prompt: string; sessionId: string }>
  ): Promise<string | object> {
    const { prompt, sessionId } = req.body;
    return this.llmService.sendMessage(prompt, sessionId);
  }
}
