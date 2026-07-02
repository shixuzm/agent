import type { Store } from './types.js';
import { chatCompletion } from './llm.js';

export interface DistillInput {
  store: Store;
  env: Record<string, string | undefined>;
  lookbackDays?: number;
}

export interface DistillProposal {
  type: 'skill' | 'subagent' | 'command';
  name: string;
  description: string;
  confidence: number;
  draftInputSchema?: Record<string, unknown>;
  draftCode?: string;
}

export interface DistillResult {
  proposals: DistillProposal[];
  summary: string;
}

export async function runDistill(input: DistillInput): Promise<DistillResult> {
  const now = Date.now();
  const lookback = (input.lookbackDays ?? 7) * 24 * 60 * 60 * 1000;
  const conversations = (await input.store.listConversations())
    .filter(c => now - c.updatedAt < lookback);

  const historyText = conversations
    .flatMap(c => c.messages.map(m => `${m.role}: ${m.content}`))
    .join('\n')
    .slice(0, 8000);

  const prompt = `请分析以下近期工作对话，识别重复出现的手动工作流，并将高置信度候选打包成可复用的 skill、subagent 或 command。\n\n${historyText}\n\n请返回 JSON 格式：\n{\n  "proposals": [{\n    "type": "skill|subagent|command",\n    "name": "...",\n    "description": "...",\n    "confidence": 0.9,\n    "draftInputSchema": {...},\n    "draftCode": "..."\n  }]\n}`;

  const raw = await chatCompletion(input.env, [
    { role: 'system', content: '你是工作流提炼专家。' },
    { role: 'user', content: prompt },
  ]);

  let parsed: { proposals?: DistillProposal[] } = {};
  try {
    parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    return { proposals: [], summary: '无法解析提炼结果' };
  }

  const proposals = (parsed.proposals ?? []).filter(p => p.confidence >= 0.7);
  return {
    proposals,
    summary: `发现 ${proposals.length} 个高置信度可复用工作流候选。`,
  };
}
