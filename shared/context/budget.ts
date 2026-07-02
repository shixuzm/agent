export interface ContextBudget {
  total: number;
  used: number;
  checkpoint: number;
  taskProgress: number;
  memory: number;
  recentMessages: number;
  systemPrompt: number;
  reserve: number;
  checkpointThreshold: number;
  rebuildThreshold: number;
}

export const DEFAULT_CONTEXT_WINDOWS: Record<string, number> = {
  '@makers/deepseek-v4-flash': 64000,
  'gpt-4o': 128000,
  'gpt-4o-mini': 128000,
  'deepseek-chat': 64000,
  default: 32000,
};

interface BudgetMessage {
  content: string;
  tokenCount?: number;
}

export function estimateTokens(text: string): number {
  // 简化估算：英文约 4 字符/token，中文约 1 字符/token
  // 混合使用：长度 / 3.5
  return Math.ceil(text.length / 3.5);
}

export function getContextWindow(modelName?: string): number {
  if (!modelName) return DEFAULT_CONTEXT_WINDOWS.default;
  return DEFAULT_CONTEXT_WINDOWS[modelName] ?? DEFAULT_CONTEXT_WINDOWS.default;
}

export function createBudget(
  modelName: string,
  usedTokens: number,
  options?: {
    contextWindow?: number;
    checkpointRatio?: number;
    taskProgressRatio?: number;
    memoryRatio?: number;
    recentMessagesRatio?: number;
    systemPromptRatio?: number;
    reserveRatio?: number;
    checkpointThreshold?: number;
    rebuildThreshold?: number;
  },
): ContextBudget {
  const total = options?.contextWindow ?? getContextWindow(modelName);
  const checkpointRatio = options?.checkpointRatio ?? 0.15;
  const taskProgressRatio = options?.taskProgressRatio ?? 0.10;
  const memoryRatio = options?.memoryRatio ?? 0.10;
  const recentMessagesRatio = options?.recentMessagesRatio ?? 0.45;
  const systemPromptRatio = options?.systemPromptRatio ?? 0.10;
  const reserveRatio = options?.reserveRatio ?? 0.10;
  const checkpointThreshold = options?.checkpointThreshold ?? 0.55;
  const rebuildThreshold = options?.rebuildThreshold ?? 0.80;

  return {
    total,
    used: usedTokens,
    checkpoint: Math.floor(total * checkpointRatio),
    taskProgress: Math.floor(total * taskProgressRatio),
    memory: Math.floor(total * memoryRatio),
    recentMessages: Math.floor(total * recentMessagesRatio),
    systemPrompt: Math.floor(total * systemPromptRatio),
    reserve: Math.floor(total * reserveRatio),
    checkpointThreshold: Math.floor(total * checkpointThreshold),
    rebuildThreshold: Math.floor(total * rebuildThreshold),
  };
}

export function shouldSaveCheckpoint(budget: ContextBudget, messages: BudgetMessage[]): boolean {
  const used = messages.reduce((sum, m) => sum + (m.tokenCount ?? estimateTokens(m.content)), 0);
  return used >= budget.checkpointThreshold;
}

export function shouldRebuildContext(budget: ContextBudget, messages: BudgetMessage[]): boolean {
  const used = messages.reduce((sum, m) => sum + (m.tokenCount ?? estimateTokens(m.content)), 0);
  return used >= budget.rebuildThreshold;
}

export function truncateToBudget<T>(
  items: T[],
  budget: number,
  measure: (item: T) => number,
  options?: { keepLast?: boolean },
): T[] {
  let used = 0;
  const result: T[] = [];
  if (options?.keepLast) {
    for (let i = items.length - 1; i >= 0; i--) {
      const cost = measure(items[i]);
      if (used + cost > budget) break;
      used += cost;
      result.unshift(items[i]);
    }
  } else {
    for (const item of items) {
      const cost = measure(item);
      if (used + cost > budget) break;
      used += cost;
      result.push(item);
    }
  }
  return result;
}
