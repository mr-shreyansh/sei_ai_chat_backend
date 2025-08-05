import { FunctionResponse, GoogleGenAI, Part } from "@google/genai";
import fetch from "node-fetch";
import { inject, injectable } from "inversify";
import { ILlmService } from "./interfaces/ILlmService";
import env from "../envConfig";
import { TYPES } from "../ioc-container/types";
import { MCPService } from "./MCPService";
import {MCPToolWrapper} from './MCPTool';
import OpenAI from "openai";

import { v4 as uuidv4 } from "uuid";
import { UserService } from "./UserService";
import { Chat } from "../types/history";
import { TOKEN_ADDRESS_MAPPING } from "../data/token";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import {ChatGoogleGenerativeAI} from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { StructuredTool } from "@langchain/core/tools";


@injectable()
export class LlmService implements ILlmService {
  private genAI: ChatGoogleGenerativeAI;
  private model: string;
  private sessionId: string;
  private client:any;


  constructor(
    @inject(TYPES.MCPService) private mcpService: MCPService,
    @inject(TYPES.UserService) private userService: UserService
  ) {
    this.genAI = new ChatGoogleGenerativeAI({
      model:'gemini-2.5-flash',
      temperature:0,
      apiKey:env.GEMINI_API_KEY
    })
    this.client = new MultiServerMCPClient({
      mcpServers: {
        "sei_tools": {
          url: "http://localhost:3001/sse",
          transport: "sse",
        }
      }
    })
    
  }

  // Initialize and store a chat session for a sessionId (generate if not provided)
  async initChat(address: string): Promise<any> {
    const toolsResponse = await this.mcpService.getTools();
    const tools =
      toolsResponse?.result?.tools || toolsResponse?.tools || toolsResponse;
    const langGraphTools: StructuredTool[] = tools.map((tool: any) => {
      if(tool.name === "transfer_sei") {
        console.dir(tool, { depth: null });
        const t = new MCPToolWrapper(this.mcpService, tool);
        console.log(t.schema._def)
      }
      return new MCPToolWrapper(this.mcpService, tool)
  });
    const agentCheckpoint = new MemorySaver();
    const agent = createReactAgent({
      llm: this.genAI,
      tools: langGraphTools,
      checkpointSaver: agentCheckpoint
    });
    
    return agent;
  }

  // Send a prompt to an existing chat session
  async sendMessage(prompt: string, address: string): Promise<string | object> {
    if (!this.mcpService.isConnected()) {
      await this.mcpService.connectToMCP();
    }
    const chat = await this.initChat(address);

    if (!chat) throw new Error("Chat session not initialized");

    const agentFinalState = await chat.invoke(
      { messages: [new HumanMessage(prompt)] }, // Use the actual prompt instead of hardcoded message
      { configurable: { thread_id: address } }, // Use address as thread_id
    );

    console.log(
      agentFinalState.messages[agentFinalState.messages.length - 1].content,
    );

    return { 
      chat: agentFinalState.messages[agentFinalState.messages.length - 1].content, 
      tool: agentFinalState.tools
    };
  }
}
