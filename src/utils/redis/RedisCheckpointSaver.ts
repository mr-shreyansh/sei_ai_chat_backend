// src/utils/RedisCheckpointSaver.ts
import Redis from "ioredis";
import { BaseCheckpointSaver, Checkpoint } from "@langchain/langgraph";

export class RedisCheckpointSaver extends BaseCheckpointSaver {
  private redis: Redis;

  constructor(redisUrl: string) {
    super();
    this.redis = new Redis(redisUrl);
  }

  async put(config: Record<string, any>, state: Checkpoint): Promise<void> {
    const key = this.getKey(config);
    await this.redis.set(key, JSON.stringify(state));
  }

  async get(config: Record<string, any>): Promise<Checkpoint | undefined> {
    const key = this.getKey(config);
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : undefined;
  }

  private getKey(config: Record<string, any>): string {
    // Use thread_id or session_id as Redis key
    return `chat:${config.thread_id || "default"}`;
  }
}
