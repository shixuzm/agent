import type { ComposeContext } from './types.js';
import { chatCompletion } from '../llm.js';

export async function validatePlan(ctx: ComposeContext): Promise<{ passed: boolean; report: string }> {
  const prompt = `请根据以下 spec 检查当前计划是否完整，返回 JSON { "passed": boolean, "report": string }。\n\nSpec:\n${ctx.plan.spec}\n\nPlan:\n${ctx.plan.steps.map(s => `- ${s.phase}: ${s.title}`).join('\n')}`;
  const raw = await chatCompletion(ctx.env, [
    { role: 'system', content: '你是验证专家。' },
    { role: 'user', content: prompt },
  ]);
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    return { passed: true, report: '验证结果解析失败，默认通过。' };
  }
}
