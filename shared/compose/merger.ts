import type { ComposeContext } from './types.js';
import { chatCompletion } from '../llm.js';

export async function generateSummary(ctx: ComposeContext): Promise<string> {
  const prompt = `请总结以下 Compose 执行结果。\n\n目标：${ctx.plan.goal}\n步骤：\n${ctx.plan.steps.map(s => `- ${s.phase}: ${s.status} ${s.result ? `| ${String(s.result).slice(0, 100)}` : ''}`).join('\n')}`;
  return chatCompletion(ctx.env, [
    { role: 'system', content: '你是项目总结专家。' },
    { role: 'user', content: prompt },
  ]);
}
