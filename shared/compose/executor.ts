import type { ComposeContext, ComposeStep } from './types.js';
import { executeSkill } from '../skills.js';
import { chatCompletion } from '../llm.js';

export async function executeStep(ctx: ComposeContext, step: ComposeStep): Promise<void> {
  step.status = 'running';

  try {
    switch (step.phase) {
      case 'plan': {
        // 使用 LLM 细化计划
        const prompt = `Goal: ${ctx.plan.goal}\nSpec:\n${ctx.plan.spec}\n\n请输出详细执行计划。`;
        step.result = await chatCompletion(ctx.env, [
          { role: 'system', content: '你是 Compose 规划器。' },
          { role: 'user', content: prompt },
        ]);
        break;
      }
      case 'execute': {
        // 调用 workflow_orchestrator 执行计划
        try {
          const result = await executeSkill(
            'skill_workflow_orchestrator',
            { action: 'createPlan', goal: ctx.plan.goal },
            ctx.env,
          );
          step.result = JSON.stringify(result);
        } catch (e) {
          step.result = `工作流编排执行失败：${e instanceof Error ? e.message : String(e)}`;
        }
        break;
      }
      case 'review': {
        try {
          const result = await executeSkill(
            'skill_code_review',
            { action: 'review', scope: 'recent' },
            ctx.env,
          );
          step.result = JSON.stringify(result);
        } catch {
          step.result = await chatCompletion(ctx.env, [
            { role: 'system', content: '你是代码审查专家。' },
            { role: 'user', content: `请审查以下 spec 的实现计划。\n\n${ctx.plan.spec}` },
          ]);
        }
        break;
      }
      case 'tdd': {
        try {
          const result = await executeSkill(
            'skill_code_execution',
            { action: 'runTests' },
            ctx.env,
          );
          step.result = JSON.stringify(result);
        } catch {
          step.result = await chatCompletion(ctx.env, [
            { role: 'system', content: '你是 TDD 专家，负责生成测试用例。' },
            { role: 'user', content: `请根据以下 spec 生成测试用例。\n\n${ctx.plan.spec}` },
          ]);
        }
        break;
      }
      case 'debug': {
        try {
          const result = await executeSkill(
            'skill_debug',
            { action: 'diagnose', context: step.result },
            ctx.env,
          );
          step.result = JSON.stringify(result);
        } catch {
          step.result = await chatCompletion(ctx.env, [
            { role: 'system', content: '你是调试专家。' },
            { role: 'user', content: `以下步骤执行失败，请诊断原因并给出修复建议。\n\n阶段：${step.phase}\n错误：${step.error ?? '未知'}` },
          ]);
        }
        break;
      }
      case 'validate': {
        try {
          const result = await executeSkill(
            'skill_validate',
            { action: 'checklist', spec: ctx.plan.spec },
            ctx.env,
          );
          step.result = JSON.stringify(result);
        } catch {
          step.result = await chatCompletion(ctx.env, [
            { role: 'system', content: '你是验证专家。' },
            { role: 'user', content: `请根据以下 spec 检查当前计划是否完整。\n\n${ctx.plan.spec}` },
          ]);
        }
        break;
      }
      case 'merge': {
        step.result = `Compose 流程完成：${ctx.plan.steps.filter(s => s.status === 'done').length} / ${ctx.plan.steps.length} 步骤已执行。`;
        break;
      }
    }
    step.status = 'done';
  } catch (e) {
    step.status = 'failed';
    step.error = e instanceof Error ? e.message : String(e);
  }
}
