export type ComposePhase =
  | 'plan'
  | 'execute'
  | 'review'
  | 'tdd'
  | 'debug'
  | 'validate'
  | 'merge';

export interface ComposeStep {
  id: string;
  phase: ComposePhase;
  title: string;
  description: string;
  dependsOn?: string[];
  status: 'pending' | 'running' | 'done' | 'failed' | 'skipped';
  result?: string;
  error?: string;
}

export interface ComposePlan {
  goal: string;
  spec: string;
  steps: ComposeStep[];
}

export interface ComposeOptions {
  autoExecute?: boolean;
  maxSteps?: number;
  requireApproval?: boolean;
}

export interface ComposeResult {
  plan: ComposePlan;
  completed: boolean;
  summary: string;
}

export interface ComposeContext {
  env: Record<string, string | undefined>;
  store: import('../types.js').Store;
  options: ComposeOptions;
  plan: ComposePlan;
}
