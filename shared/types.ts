/**
 * Core type definitions for the AI multi-agent system.
 */

export const SKILL_IDS = {
  DIALOGUE_ASSISTANT: 'skill_dialogue_assistant',
  FILE_HANDLER: 'skill_file_handler',
  CONTENT_GENERATOR: 'skill_content_generator',
  WORKFLOW_ORCHESTRATOR: 'skill_workflow_orchestrator',
  SCHEDULER: 'skill_scheduler',
} as const;

export interface ModelConfig {
  provider: 'makers' | 'openai' | 'anthropic' | 'custom';
  modelId: string;
  baseUrl?: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  handler?: string; // inline handler name for built-in skills
  associatedKnowledgeBaseIds?: string[];
  associatedAPIIds?: string[];
}

export interface AgentDefinition {
  id: string;
  name: string;
  avatar?: string;
  description: string;
  role: 'super' | 'coder' | 'writer' | 'researcher' | 'reviewer' | 'custom';
  systemPrompt: string;
  modelConfig?: ModelConfig;
  // skillIds is intentionally a plain string array so agents can reference any skill,
  // including built-in skills, user-defined skills, and future skills.
  skillIds: string[];
  knowledgeBaseIds?: string[];
  toolPermissions?: string[];
  isBuiltIn: boolean;
  generation?: number; // how many times this agent has evolved
  createdAt?: number;
  updatedAt?: number;
}

export interface AgentReflection {
  id: string;
  agentId: string;
  taskId?: string;
  conversationId?: string;
  originalOutput: string;
  assessment: 'good' | 'adequate' | 'poor';
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  suggestedPromptDelta?: string;
  suggestedSkillIds?: string[];
  timestamp: number;
}

export interface AgentEvolution {
  id: string;
  agentId: string;
  generation: number;
  previousPrompt: string;
  newPrompt: string;
  reason: string;
  triggeredByReflectionId?: string;
  timestamp: number;
}

export interface ImprovementProposal {
  id: string;
  targetType: 'agent' | 'skill' | 'code' | 'system';
  targetId?: string;
  description: string;
  proposedChanges: string;
  status: 'proposed' | 'applied' | 'rejected';
  rationale: string;
  timestamp: number;
  appliedAt?: number;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  documents: Document[];
}

export interface Document {
  id: string;
  knowledgeBaseId: string;
  fileName: string;
  content: string;
  status: 'pending' | 'indexed' | 'error';
}

export interface Task {
  id: string;
  parentTaskId?: string;
  agentId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input: string;
  output?: string;
  dependencies?: string[];
  createdAt: number;
  completedAt?: number;
  error?: string;
}

export interface ScheduledTask {
  id: string;
  name: string;
  description?: string;
  cron: string;
  skillId: string;
  params?: Record<string, unknown>;
  enabled: boolean;
  createdAt: number;
  updatedAt?: number;
  lastRunAt?: number;
  nextRunAt?: number;
}

export interface Conversation {
  id: string;
  title?: string;
  userId?: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  agentId?: string;
  taskId?: string;
  toolCalls?: ToolCall[];
  metadata?: Record<string, unknown>;
  timestamp: number;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
}

export interface APIConfig {
  id: string;
  name: string;
  provider: string;
  baseUrl: string;
  apiKey?: string;
  modelId?: string;
  isDefault?: boolean;
}

export interface OrchestratorInput {
  message: string;
  conversationId: string;
  userId?: string;
  preferredAgentId?: string;
  context?: string;
}

export interface OrchestratorPlan {
  tasks: Task[];
  reasoning: string;
}

export interface Store {
  // Agents
  listAgents(): AgentDefinition[] | Promise<AgentDefinition[]>;
  getAgent(id: string): AgentDefinition | undefined | Promise<AgentDefinition | undefined>;
  saveAgent(agent: AgentDefinition): void | Promise<void>;
  deleteAgent(id: string): void | Promise<void>;

  // Skills
  listSkills(): SkillDefinition[] | Promise<SkillDefinition[]>;
  getSkill(id: string): SkillDefinition | undefined | Promise<SkillDefinition | undefined>;
  saveSkill(skill: SkillDefinition): void | Promise<void>;
  deleteSkill(id: string): void | Promise<void>;

  // Knowledge bases
  listKnowledgeBases(): KnowledgeBase[] | Promise<KnowledgeBase[]>;
  getKnowledgeBase(id: string): KnowledgeBase | undefined | Promise<KnowledgeBase | undefined>;

  // Conversations
  getConversation(id: string): Conversation | undefined | Promise<Conversation | undefined>;
  saveConversation(conversation: Conversation): void | Promise<void>;
  listConversations(userId?: string): Conversation[] | Promise<Conversation[]>;
  deleteConversation(id: string): void | Promise<void>;

  // Tasks
  getTask(id: string): Task | undefined | Promise<Task | undefined>;
  saveTask(task: Task): void | Promise<void>;
  listTasks(conversationId?: string): Task[] | Promise<Task[]>;

  // Scheduled tasks
  listScheduledTasks(): ScheduledTask[] | Promise<ScheduledTask[]>;
  getScheduledTask(id: string): ScheduledTask | undefined | Promise<ScheduledTask | undefined>;
  saveScheduledTask(task: ScheduledTask): void | Promise<void>;
  deleteScheduledTask(id: string): void | Promise<void>;

  // Reflections & evolution
  saveReflection(reflection: AgentReflection): void | Promise<void>;
  listReflections(agentId?: string): AgentReflection[] | Promise<AgentReflection[]>;
  saveEvolution(evolution: AgentEvolution): void | Promise<void>;
  listEvolutions(agentId?: string): AgentEvolution[] | Promise<AgentEvolution[]>;

  // Improvement proposals (for self-improving the app)
  saveProposal(proposal: ImprovementProposal): void | Promise<void>;
  listProposals(status?: ImprovementProposal['status']): ImprovementProposal[] | Promise<ImprovementProposal[]>;
  getProposal(id: string): ImprovementProposal | undefined | Promise<ImprovementProposal | undefined>;
}
