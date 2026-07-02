import { ContextBudget, estimateTokens, truncateToBudget } from './budget.js';
import type { Message } from '../types.js';
import type { MemoryStore } from '../memory/store.js';

export interface RebuildInput {
  budget: ContextBudget;
  checkpointText: string | null;
  taskProgressText: string | null;
  memoryStore: MemoryStore | null;
  userInput: string;
  recentMessages: Message[];
  systemPrompt: string;
}

export interface RebuildOutput {
  messages: Message[];
  shouldSaveCheckpoint: boolean;
  tokenUsage: {
    checkpoint: number;
    taskProgress: number;
    memory: number;
    recentMessages: number;
    systemPrompt: number;
  };
}

export async function rebuildContext(input: RebuildInput): Promise<RebuildOutput> {
  const usage = {
    checkpoint: 0,
    taskProgress: 0,
    memory: 0,
    recentMessages: 0,
    systemPrompt: 0,
  };

  // 1. system prompt
  const systemMessages: Message[] = [];
  const systemTokens = estimateTokens(input.systemPrompt);
  if (systemTokens <= input.budget.systemPrompt) {
    systemMessages.push({
      id: 'system-prompt',
      conversationId: '',
      role: 'system',
      content: input.systemPrompt,
      timestamp: Date.now(),
      tokenCount: systemTokens,
    });
    usage.systemPrompt = systemTokens;
  }

  // 2. checkpoint（最高优先级）
  const contextMessages: Message[] = [];
  if (input.checkpointText) {
    const tokens = estimateTokens(input.checkpointText);
    if (tokens <= input.budget.checkpoint) {
      contextMessages.push({
        id: 'checkpoint',
        conversationId: '',
        role: 'system',
        content: `## Conversation Checkpoint\n${input.checkpointText}`,
        timestamp: Date.now(),
        tokenCount: tokens,
      });
      usage.checkpoint = tokens;
    }
  }

  // 3. task progress
  if (input.taskProgressText) {
    const tokens = estimateTokens(input.taskProgressText);
    if (tokens <= input.budget.taskProgress) {
      contextMessages.push({
        id: 'task-progress',
        conversationId: '',
        role: 'system',
        content: `## Task Progress\n${input.taskProgressText}`,
        timestamp: Date.now(),
        tokenCount: tokens,
      });
      usage.taskProgress = tokens;
    }
  }

  // 4. memory search
  if (input.memoryStore?.isEnabled()) {
    const results = input.memoryStore.searchMemories(input.userInput, { limit: 5 });
    let memoryTokens = 0;
    for (const result of results) {
      const snippet = `${result.memory.title}: ${result.memory.content}`.slice(0, 200);
      const tokens = estimateTokens(snippet);
      if (memoryTokens + tokens > input.budget.memory) break;
      memoryTokens += tokens;
      contextMessages.push({
        id: `memory-${result.memory.id}`,
        conversationId: '',
        role: 'system',
        content: `## Relevant Memory\n${snippet}`,
        timestamp: result.memory.updatedAt,
        tokenCount: tokens,
      });
    }
    usage.memory = memoryTokens;
  }

  // 5. recent messages（保留最近的，直到用完预算）
  const recent = truncateToBudget(
    input.recentMessages,
    input.budget.recentMessages,
    m => m.tokenCount ?? estimateTokens(m.content),
    { keepLast: true },
  );
  usage.recentMessages = recent.reduce((sum, m) => sum + (m.tokenCount ?? estimateTokens(m.content)), 0);

  return {
    messages: [...systemMessages, ...contextMessages, ...recent],
    shouldSaveCheckpoint: false, // 由调用方根据 budget 决定
    tokenUsage: usage,
  };
}
