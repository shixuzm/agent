import type { ComposeContext, ComposeStep } from './types.js';
import { chatCompletion } from '../llm.js';

export async function reviewStep(ctx: ComposeContext, step: ComposeStep): Promise<string> {
  const prompt = `请审查以下步骤的结果并给出通过/不通过及改进建议。\n\n阶段：${step.phase}\n结果：${step.result ?? '无'}`;
  return chatCompletion(ctx.env, [
    { role: 'system', content: '你是代码审查专家。' },
    { role: 'user', content: prompt },
  ]);
}
