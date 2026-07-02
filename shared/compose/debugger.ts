import type { ComposeContext, ComposeStep } from './types.js';
import { chatCompletion } from '../llm.js';

export async function diagnose(ctx: ComposeContext, failedStep: ComposeStep): Promise<string> {
  const prompt = `以下步骤执行失败，请诊断原因并给出修复建议。\n\n阶段：${failedStep.phase}\n错误：${failedStep.error ?? '未知'}`;
  return chatCompletion(ctx.env, [
    { role: 'system', content: '你是调试专家。' },
    { role: 'user', content: prompt },
  ]);
}
