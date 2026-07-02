import type { ComposeContext, ComposeStep } from './types.js';
import { chatCompletion } from '../llm.js';

export async function generateTests(ctx: ComposeContext, _step: ComposeStep): Promise<string> {
  const prompt = `请根据以下 spec 生成测试用例。\n\n${ctx.plan.spec}`;
  return chatCompletion(ctx.env, [
    { role: 'system', content: '你是 TDD 专家，负责生成测试用例。' },
    { role: 'user', content: prompt },
  ]);
}
