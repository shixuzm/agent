/**
 * Core type definitions for the AI multi-agent system.
 */

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
  skillIds: string[];
  knowledgeBaseIds?: string[];
  toolPermissions?: string[];
  isBuiltIn: boolean;
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
  listAgents(): AgentDefinition[];
  getAgent(id: string): AgentDefinition | undefined;
  saveAgent(agent: AgentDefinition): void;
  deleteAgent(id: string): void;

  // Skills
  listSkills(): SkillDefinition[];
  getSkill(id: string): SkillDefinition | undefined;
  saveSkill(skill: SkillDefinition): void;
  deleteSkill(id: string): void;

  // Knowledge bases
  listKnowledgeBases(): KnowledgeBase[];
  getKnowledgeBase(id: string): KnowledgeBase | undefined;

  // Conversations
  getConversation(id: string): Conversation | undefined;
  saveConversation(conversation: Conversation): void;
  listConversations(userId?: string): Conversation[];
  deleteConversation(id: string): void;

  // Tasks
  getTask(id: string): Task | undefined;
  saveTask(task: Task): void;
  listTasks(conversationId?: string): Task[];
}
