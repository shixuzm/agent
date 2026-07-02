import type { Store } from './types.js';
import { chatCompletion } from './llm.js';

export interface DreamInput {
  store: Store;
  env: Record<string, string | undefined>;
  conversationIds?: string[];
  lookbackDays?: number;
}

export interface DreamResult {
  added: number;
  updated: number;
  removed: number;
  summary: string;
}

export async function runDream(input: DreamInput): Promise<DreamResult> {
  // 1. 获取近期会话（默认 7 天）
  const now = Date.now();
  const lookback = (input.lookbackDays ?? 7) * 24 * 60 * 60 * 1000;
  const conversations = (await input.store.listConversations())
    .filter(c => now - c.updatedAt < lookback)
    .filter(c => !input.conversationIds || input.conversationIds.includes(c.id));

  // 2. 将会话历史拼接成文本
  const historyText = conversations
    .flatMap(c => c.messages.map(m => `${m.role}: ${m.content}`))
    .join('\n')
    .slice(0, 8000);

  // 3. 调用 LLM 提取持久知识
  const prompt = `请从以下近期对话中提取应持久保存的项目知识，并识别已过时的条目。\n\n${historyText}\n\n请返回 JSON 格式：\n{\n  "newMemories": [{"type":"fact|decision|pattern","content":"...","title":"..."}],\n  "outdatedMemoryIds": ["..."]\n}`;

  const raw = await chatCompletion(input.env, [
    { role: 'system', content: '你是项目记忆管理员。' },
    { role: 'user', content: prompt },
  ]);

  let parsed: { newMemories?: Array<{ type: string; content: string; title: string }>; outdatedMemoryIds?: string[] } = {};
  try {
    parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    return { added: 0, updated: 0, removed: 0, summary: '无法解析提取结果' };
  }

  // 4. 写入全局记忆（动态导入以避免 Web 构建问题）
  const memoryStore = await import('./memory/store.js')
    .then(m => m.getGlobalMemoryStore())
    .catch(() => null);

  let added = 0;
  if (memoryStore?.isEnabled()) {
    for (const m of parsed.newMemories ?? []) {
      memoryStore.addMemory({
        type: (m.type as any) ?? 'fact',
        scope: 'project',
        title: m.title ?? 'Extracted memory',
        content: m.content,
      });
      added++;
    }
    for (const id of parsed.outdatedMemoryIds ?? []) {
      memoryStore.deleteMemory(id);
    }
  }

  return {
    added,
    updated: 0,
    removed: parsed.outdatedMemoryIds?.length ?? 0,
    summary: `提取了 ${added} 条新知识，清理了 ${parsed.outdatedMemoryIds?.length ?? 0} 条过时记忆。`,
  };
}
