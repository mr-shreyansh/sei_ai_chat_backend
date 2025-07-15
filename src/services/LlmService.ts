import { GoogleGenAI, Part } from "@google/genai";
import fetch from "node-fetch";
import { inject, injectable } from "inversify";
import { ILlmService } from "./interfaces/ILlmService";
import env from "../envConfig";
import { TYPES } from "../ioc-container/types";
import { MCPService } from "./MCPService";

@injectable()
export class LlmService implements ILlmService {
  private genAI: GoogleGenAI;
  private model: string;
  private sessionId: string;
  // private model: any;

  constructor(@inject(TYPES.MCPService) private mcpService: MCPService) {
    this.genAI = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    // this.model =  this.genAI.getGenerativeModel({
    //     model: "gemini-1.5-pro-latest",
    // });
    this.model = "gemini-2.0-flash-001";
  }

  private async getTools(): Promise<any> {
    try {
      if (this.mcpService.isConnected) {
        const tools = await this.mcpService.callTool("tools/list", {});
        return tools;
      }
      return [];
    } catch (err) {
      console.log("error occured", err);
    }
  }

  async startChat(prompt: string, sessionId: string): Promise<string | object> {
    if (!this.mcpService.isConnected()) {
      await this.mcpService.connectToMCP();
    }
    console.log("we start");
    const toolsResponse = await this.mcpService.getTools();
    const tools =
      toolsResponse?.result?.tools || toolsResponse?.tools || toolsResponse;
    console.log("Actual tools:", JSON.stringify(tools, null, 2));
    console.log("tools:", tools);
    console.log("we here still going");
    const chat = this.genAI.chats.create({
      model: this.model,
      config: {
        tools: [{functionDeclarations: tools}],
      },
    });

    const result = await chat.sendMessage({ message: prompt });
    console.log("this is the first result", result);
    const call = result?.functionCalls?.[0];

    if (call) {
      console.log(`Gemini wants to call the tool: ${call.name}`);
      console.log(`With arguments: ${JSON.stringify(call.args)}`);

      const output = await this.mcpService.callTool(call.name, call.args);
        console.log('this is output',output)

      const functionResponsePart: Part = {
        functionResponse: {
          name: call.name,
          response: output?.result,
        },
      };

      const finalResult = await chat.sendMessage({
        message: [functionResponsePart],
      });

      return finalResult.text;
    }
    return result.text;
  }
}
