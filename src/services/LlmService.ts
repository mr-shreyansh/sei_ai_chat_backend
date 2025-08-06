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
import { MongoClient } from "mongodb";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";


// The prompt is static and can be defined once.
const systemPrompt = `You are a helpful assistant. You have access to the conversation history. Use it to answer the user's questions.`;
// const prompt = ChatPromptTemplate.fromMessages([
//   ["system", systemPrompt],
// ]);
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
    console.log("constructor")
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
      return new MCPToolWrapper(this.mcpService, tool)
  });
  // Connect to your Atlas cluster or local Atlas deployment
  const client = new MongoClient(env.MONGO_URI);
  // Initialize the MongoDB checkpointer
  const checkpointer = new MongoDBSaver({client});
    const agent = createReactAgent({
      llm: this.genAI,
      tools: langGraphTools,
      stateModifier: systemPrompt,
      checkpointSaver: checkpointer
    });
    
    return agent;
  }

  // Send a prompt to an existing chat session
  async sendMessage(prompt: string, address: string): Promise<string | object> {
    if (!this.mcpService.isConnected()) {
      await this.mcpService.connectToMCP();
    }
    //only initialize if needed
    const chat = await this.initChat(address);

    if (!chat) throw new Error("Chat session not initialized");

    const initialState = await chat.getState({ configurable: { thread_id: address } });
    console.log('hi')
    console.dir(initialState);

    const agentFinalState = await chat.invoke(
      { messages: [new HumanMessage(prompt)] }, // Use the actual prompt instead of hardcoded message
      { configurable: { thread_id: address } }, // Use address as thread_id
    );

    const newMessages = initialState?.values?.messages 
      ? agentFinalState.messages.slice(initialState.values.messages.length)
      : agentFinalState.messages;
    console.log("Agent final state:")
    console.dir(
      agentFinalState
    );
    console.log("New messages:")
    console.dir(newMessages);

    const res = { 
      chat: newMessages[newMessages.length - 1].content, 
      tools: newMessages.filter((msg: any) => msg.constructor.name === "ToolMessage").map((msg: any) => JSON.parse(msg?.content)?.result)
    };
    console.log("Response from agent:", res,newMessages.filter((msg: any) => msg.constructor.name === "ToolMessage"))
    return res
  }

  async addtxn(prompt: string, address: string): Promise<string | object> {
    if (!this.mcpService.isConnected()) {
      await this.mcpService.connectToMCP();
    }
    // Ensure chat is initialized
    const chat = await this.initChat(address);

    if (!chat) throw new Error("Chat session not initialized");
    let history: Chat[] = [];

    history.push({
      role: "user",
      parts: [{ text: prompt+"get the details for this hash of just executed transaction" }],
    });

    const result = await chat.sendMessage({ message: prompt+"get the details for this hash of just executed transaction by calling get_transaction tool" });
    console.log("this is the first result", result);
    const calls = result?.functionCalls;

    if (calls && calls.length) {
      const outputs = [];
      const functionResponseParts: Part[] = [];
      for (let i = 0; i < calls.length; i++) {
        const output = await this.mcpService.callTool(
          calls[i].name,
          calls[i].args
        );
        outputs.push(output?.result);
        const functionResponsePart: Part = {
          functionResponse: {
            name: calls[i].name,
            response: output?.result,
          },
        };
        const contentArray = output?.result?.content;
        let txObject = null;

        if (
          calls[i].name === "get_transaction" &&
          Array.isArray(contentArray) &&
          contentArray.length > 0 &&
          contentArray[0].type === "text"
        ) {
          try {
            txObject = JSON.parse(contentArray[0].text);
            console.log("this is my baby", txObject);
            await this.userService.addUserTransaction(address, {
              hash: txObject?.hash,
              value: txObject?.value,
              token: txObject?.token,
              gas: txObject?.gas,
              gasPrice: txObject?.gasPrice,
              from: txObject?.from,
              to: txObject?.to,
              type: txObject?.type,
              input: txObject?.input,
              blockNumber: txObject?.blockNumber,
            });
          } catch (err) {
            console.error("Failed to parse transaction JSON:", err);
          }
        }

        functionResponseParts.push(functionResponsePart);
      }
      console.dir(functionResponseParts, { depth: null });
      const finalResult = await chat.sendMessage({
        message: functionResponseParts,
      });
      if (finalResult.text)
        history.push({
          role: "model",
          parts: [{ text: finalResult.text }],
        });

      await this.userService.addUserHistory(address, history);

      return {
        tools: outputs,
        chat: finalResult.text,
      };
    }
    if (result.text)
      history.push({
        role: "model",
        parts: [{ text: result.text }],
      });

    await this.userService.addUserHistory(address, history);

    return { chat: result.text, tool: null };
  }
}
