import type { ComposePlan, ComposeStep, ComposePhase } from './types.js';

const DEFAULT_PHASES: ComposePhase[] = ['plan', 'execute', 'review', 'tdd', 'debug', 'validate', 'merge'];

export async function createPlan(specText: string, goal?: string): Promise<ComposePlan> {
  const steps: ComposeStep[] = DEFAULT_PHASES.map((phase, index) => ({
    id: `step-${index + 1}`,
    phase,
    title: phaseTitle(phase),
    description: phaseDescription(phase),
    status: 'pending',
  }));

  // 简单依赖链
  for (let i = 1; i < steps.length; i++) {
    steps[i].dependsOn = [steps[i - 1].id];
  }

  return {
    goal: goal ?? '完成 spec 驱动的开发任务',
    spec: specText,
    steps,
  };
}

function phaseTitle(phase: ComposePhase): string {
  const map: Record<ComposePhase, string> = {
    plan: '规划',
    execute: '执行',
    review: '审查',
    tdd: 'TDD',
    debug: '调试',
    validate: '验证',
    merge: '合并',
  };
  return map[phase];
}

function phaseDescription(phase: ComposePhase): string {
  const map: Record<ComposePhase, string> = {
    plan: '根据 spec 拆分任务并制定执行计划',
    execute: '调用 skills/subagents 完成代码实现',
    review: '代码审查与反馈',
    tdd: '编写并运行测试',
    debug: '诊断并修复问题',
    validate: '核对检查清单与构建验证',
    merge: '合并收尾并生成最终总结',
  };
  return map[phase];
}
