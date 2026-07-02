import { ContextBudget, shouldSaveCheckpoint } from './budget.js';
import type { Conversation } from '../types.js';
import { chatCompletion } from '../llm.js';
import { getStore } from '../store.js';

const checkpointUpdateCounters = new Map<string, number>();

export async function loadCheckpoint(conversationId: string): Promise<string | null> {
  const { getGlobalMemoryStore } = await import('../memory/store.js');
  const store = await getGlobalMemoryStore().catch(() => null);
  if (!store?.isEnabled()) return null;
  const { loadCheckpoint: loadMemoryCheckpoint } = await import('../memory/checkpoint.js');
  return loadMemoryCheckpoint(store, conversationId);
}

export async function maybeSaveCheckpoint(
  env: Record<string, string | undefined>,
  conversation: Conversation,
  budget: ContextBudget,
): Promise<void> {
  const { getGlobalMemoryStore } = await import('../memory/store.js');
  const store = await getGlobalMemoryStore().catch(() => null);
  if (!store?.isEnabled()) return;

  if (!shouldSaveCheckpoint(budget, conversation.messages)) return;

  const userMessageCount = conversation.messages.filter(m => m.role === 'user').length;
  const lastUpdatedCount = checkpointUpdateCounters.get(conversation.id) ?? 0;
  if (userMessageCount - lastUpdatedCount < 3) return; // 避免过于频繁

  const content = await generateCheckpoint(env, conversation);
  if (content) {
    const { saveCheckpoint: saveMemoryCheckpoint } = await import('../memory/checkpoint.js');
    saveMemoryCheckpoint(store, conversation.id, content);
    checkpointUpdateCounters.set(conversation.id, userMessageCount);
  }
}

export async function generateCheckpoint(
  env: Record<string, string | undefined>,
  conversation: Conversation,
): Promise<string | null> {
  const agent = await getStore(env).getAgent('agent_checkpoint_writer');
  if (!agent) return null;

  const historyText = conversation.messages
    .slice(-20)
    .map(m => `${m.role}: ${m.content}`)
    .join('\n');

  const prompt = `请根据以下对话历史生成会话检查点摘要。\n\n${historyText}`;
  const result = await chatCompletion(env, [
    { role: 'system', content: agent.systemPrompt },
    { role: 'user', content: prompt },
  ]);
  return result || null;
}
