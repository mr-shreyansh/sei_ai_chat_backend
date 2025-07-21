import { GoogleGenAI, Part, Chat } from "@google/genai";
import fetch from "node-fetch";
import { inject, injectable } from "inversify";
import { ILlmService } from "./interfaces/ILlmService";
import env from "../envConfig";
import { TYPES } from "../ioc-container/types";
import { MCPService } from "./MCPService";
import OpenAI from "openai";

import { v4 as uuidv4 } from "uuid";

@injectable()
export class LlmService implements ILlmService {
  private genAI: GoogleGenAI;
  private model: string;
  private sessionId: string;
  private openai: OpenAI;
  private chatSessions: Map<string, Chat> = new Map();
  private chatHistories: Map<string, Array<any>> = new Map();

  constructor(@inject(TYPES.MCPService) private mcpService: MCPService) {
    this.genAI = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    this.openai = new OpenAI({
      apiKey: env.LLAMA_API_KEY,
    });
    this.model = "gemini-2.0-flash";
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

  // Initialize and store a chat session for a sessionId (generate if not provided)
  async initChat(sessionId?: string): Promise<{ sessionId: string }> {
    const id = sessionId || uuidv4();

    const toolsResponse = await this.mcpService.getTools();
    const tools =
      toolsResponse?.result?.tools || toolsResponse?.tools || toolsResponse;

    const history = this.chatHistories.get(id) || [];
    const chat = this.genAI.chats.create({
      model: this.model,
      history: history,
      config: {
        systemInstruction:
          "Always include all possible arguments for a tool, even if they are optional. If the tool has a 'network' parameter, always pass it. If the user does not specify a network, use the default value (e.g., 'sei'). In the response Try to highlight important points, use levels of headings and different bullet points and tables if needed, and also provide referces at the end",
        tools: [{ functionDeclarations: tools }],
        temperature: 0,
      },
    });

    this.chatSessions.set(id, chat);
    return { sessionId: id };
  }

  // Send a prompt to an existing chat session
  async sendMessage(
    prompt: string,
    sessionId: string
  ): Promise<string | object> {
    if (!this.mcpService.isConnected()) {
      await this.mcpService.connectToMCP();
    }

    // Ensure chat is initialized
    await this.initChat(sessionId);

    const chat = this.chatSessions.get(sessionId);
    if (!chat) throw new Error("Chat session not initialized");
    let history = this.chatHistories.get(sessionId) || [];

    history.push({
      role: "user",
      parts: [{ text: prompt }],
    });

    if (history.length > 2) {
      history = history.slice(history.length - 2);
    }

    this.chatHistories.set(sessionId, history);
    const result = await chat.sendMessage({ message: prompt });
    console.log("this is the first result", result);
    const call = result?.functionCalls?.[0];

    if (call) {
      console.log(`Gemini wants to call the tool: ${call.name}`);
      console.log(`With arguments: ${JSON.stringify(call.args)}`);

      const output = await this.mcpService.callTool(call.name, call.args);
      console.log("this is output", output);

      const functionResponsePart: Part = {
        functionResponse: {
          name: call.name,
          response: output?.result,
        },
      };

      const finalResult = await chat.sendMessage({
        message: [functionResponsePart],
      });

      history.push({
        role: "model",
        parts: [{ text: finalResult.text }],
      });

      this.chatHistories.set(sessionId, history);

      return {
        tool: output?.result,
        chat: finalResult.text,
      };
    }
    return { chat: result.text, tool: null };
  }
}
