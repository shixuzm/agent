import { createPlan } from './planner.js';
import { executeStep } from './executor.js';
import { validatePlan } from './validator.js';
import { generateSummary } from './merger.js';
import type { ComposePlan, ComposeResult, ComposeOptions, ComposeContext } from './types.js';
import type { Store } from '../types.js';

export * from './types.js';
export { createPlan } from './planner.js';
export { executeStep } from './executor.js';

export async function runCompose(
  env: Record<string, string | undefined>,
  store: Store,
  specText: string,
  goal?: string,
  options: ComposeOptions = {},
): Promise<ComposeResult> {
  const plan = await createPlan(specText, goal);
  const ctx: ComposeContext = { env, store, options, plan };

  const validation = await validatePlan(ctx);
  if (!validation.passed) {
    return { plan, completed: false, summary: `规划验证未通过：${validation.report}` };
  }

  const maxSteps = options.maxSteps ?? 20;
  let executed = 0;

  for (const step of plan.steps) {
    if (executed >= maxSteps) break;

    if (options.requireApproval && step.phase !== 'plan') {
      // 需要前端确认时，这里只执行到 plan 阶段，然后返回
      // 实际确认后继续调用 continueCompose
      step.status = 'pending';
      return { plan, completed: false, summary: '等待用户确认继续执行。' };
    }

    await executeStep(ctx, step);
    executed++;

    if (step.status === 'failed' && step.phase !== 'debug') {
      // 失败后进入 debug 阶段
      const debugStep = plan.steps.find(s => s.phase === 'debug');
      if (debugStep) {
        debugStep.status = 'pending';
        await executeStep(ctx, debugStep);
      }
    }
  }

  const summary = await generateSummary(ctx);
  return { plan, completed: true, summary };
}

export async function continueCompose(
  env: Record<string, string | undefined>,
  store: Store,
  plan: ComposePlan,
  options: ComposeOptions = {},
): Promise<ComposeResult> {
  const ctx: ComposeContext = { env, store, options, plan };
  const maxSteps = options.maxSteps ?? 20;
  let executed = 0;

  for (const step of plan.steps) {
    if (step.status === 'done' || step.status === 'skipped') continue;
    if (executed >= maxSteps) break;
    await executeStep(ctx, step);
    executed++;
  }

  const summary = await generateSummary(ctx);
  return { plan, completed: plan.steps.every(s => s.status === 'done' || s.status === 'skipped'), summary };
}
