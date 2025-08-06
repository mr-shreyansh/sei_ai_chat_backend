import { controller, httpPost, request } from "inversify-express-utils";
import { inject } from "inversify";
import { TYPES } from "../ioc-container/types";
import { type Request } from "express";
import { ILlmService } from "../services/interfaces/ILlmService";
import AuthMiddleware from "../middleware/AuthMiddleware";
import { AuthenticatedRequest } from "../types/requestTypes";

@controller("/llm", TYPES.AuthMiddleware)
export class LlmController {
  constructor(@inject(TYPES.LlmService) private llmService: ILlmService) {}

  @httpPost("/init")
  private async init(
    @request() req: AuthenticatedRequest
  ): Promise<{ success: boolean }> {
    const address = req.userAddress;
    const response = await this.llmService.initChat(address);
    return { success: true };
  }

  @httpPost("/chat")
  private async chat(
    @request()
    req: AuthenticatedRequest
  ): Promise<string | object> {
    const { prompt } = req.body;
    const address = req.userAddress
    return this.llmService.sendMessage(prompt, address);
  }

  @httpPost("/addtxn")
  private async addtxn(
    @request()
    req: AuthenticatedRequest
  ): Promise<string | object> {
    const {prompt} = req.body;
    const address = req.userAddress;
    return this.llmService.addtxn(prompt, address);
  }
}
