/**
 * Makers KV-backed store implementation.
 *
 * Falls back to in-memory store when KV binding is unavailable.
 *
 * Expected KV binding (configurable via EDGEONE_KV_BINDING env):
 *   binding name: KV
 *   methods: get(key), put(key, value), delete(key)
 *
 * For EdgeOne Makers, bind a KV namespace in the console and the runtime
 * will inject it into context.env / process.env.
 */

import type {
  Store,
  AgentDefinition,
  SkillDefinition,
  KnowledgeBase,
  Conversation,
  Task,
  ScheduledTask,
  AgentReflection,
  AgentEvolution,
  ImprovementProposal,
} from './types';
import { MemoryStore } from './store';

const STATE_KEY = 'ai_agent_state';
const DEFAULT_BINDING_NAME = 'KV';

interface KVState {
  agents: AgentDefinition[];
  skills: SkillDefinition[];
  knowledgeBases: KnowledgeBase[];
  conversations: Conversation[];
  tasks: Task[];
  scheduledTasks: ScheduledTask[];
  reflections: AgentReflection[];
  evolutions: AgentEvolution[];
  proposals: ImprovementProposal[];
}

export interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

function getKVBinding(env: Record<string, unknown>): KVNamespace | undefined {
  const bindingName = (env.EDGEONE_KV_BINDING as string) || DEFAULT_BINDING_NAME;
  const binding = env[bindingName];
  if (binding && typeof (binding as KVNamespace).get === 'function' && typeof (binding as KVNamespace).put === 'function') {
    return binding as KVNamespace;
  }
  return undefined;
}

export class KVStore implements Store {
  private memory: MemoryStore;
  private kv?: KVNamespace;
  private loaded = false;

  constructor(env: Record<string, unknown>) {
    this.memory = new MemoryStore();
    this.kv = getKVBinding(env);
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded || !this.kv) return;
    try {
      const raw = await this.kv.get(STATE_KEY);
      if (raw) {
        const state: KVState = JSON.parse(raw);
        for (const agent of state.agents ?? []) this.memory.saveAgent(agent);
        for (const skill of state.skills ?? []) this.memory.saveSkill(skill);
        for (const kb of state.knowledgeBases ?? []) {
          // Knowledge base not directly exposed on Store interface; keep internal map via reflection
          (this.memory as any).knowledgeBases.set(kb.id, kb);
        }
        for (const conv of state.conversations ?? []) this.memory.saveConversation(conv);
        for (const task of state.tasks ?? []) this.memory.saveTask(task);
        for (const scheduledTask of state.scheduledTasks ?? []) this.memory.saveScheduledTask(scheduledTask);
        for (const r of state.reflections ?? []) this.memory.saveReflection(r);
        for (const e of state.evolutions ?? []) this.memory.saveEvolution(e);
        for (const p of state.proposals ?? []) this.memory.saveProposal(p);
      }
    } catch (e) {
      console.error('[KVStore] failed to load state:', e);
    } finally {
      this.loaded = true;
    }
  }

  private async persist(): Promise<void> {
    if (!this.kv) return;
    const state: KVState = {
      agents: this.memory.listAgents(),
      skills: this.memory.listSkills(),
      knowledgeBases: this.memory.listKnowledgeBases(),
      conversations: this.memory.listConversations(),
      tasks: this.memory.listTasks(),
      scheduledTasks: this.memory.listScheduledTasks(),
      reflections: this.memory.listReflections(),
      evolutions: this.memory.listEvolutions(),
      proposals: this.memory.listProposals(),
    };
    try {
      await this.kv.put(STATE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('[KVStore] failed to persist state:', e);
    }
  }

  private async withPersist<T>(fn: () => T): Promise<T> {
    await this.ensureLoaded();
    const result = fn();
    await this.persist();
    return result;
  }

  // Agents
  async listAgents(): Promise<AgentDefinition[]> {
    await this.ensureLoaded();
    return this.memory.listAgents();
  }

  async getAgent(id: string): Promise<AgentDefinition | undefined> {
    await this.ensureLoaded();
    return this.memory.getAgent(id);
  }

  async saveAgent(agent: AgentDefinition): Promise<void> {
    return this.withPersist(() => this.memory.saveAgent(agent));
  }

  async deleteAgent(id: string): Promise<void> {
    return this.withPersist(() => this.memory.deleteAgent(id));
  }

  // Skills
  async listSkills(): Promise<SkillDefinition[]> {
    await this.ensureLoaded();
    return this.memory.listSkills();
  }

  async getSkill(id: string): Promise<SkillDefinition | undefined> {
    await this.ensureLoaded();
    return this.memory.getSkill(id);
  }

  async saveSkill(skill: SkillDefinition): Promise<void> {
    return this.withPersist(() => this.memory.saveSkill(skill));
  }

  async deleteSkill(id: string): Promise<void> {
    return this.withPersist(() => this.memory.deleteSkill(id));
  }

  // Knowledge bases
  async listKnowledgeBases(): Promise<KnowledgeBase[]> {
    await this.ensureLoaded();
    return this.memory.listKnowledgeBases();
  }

  async getKnowledgeBase(id: string): Promise<KnowledgeBase | undefined> {
    await this.ensureLoaded();
    return this.memory.getKnowledgeBase(id);
  }

  // Conversations
  async getConversation(id: string): Promise<Conversation | undefined> {
    await this.ensureLoaded();
    return this.memory.getConversation(id);
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    return this.withPersist(() => this.memory.saveConversation(conversation));
  }

  async listConversations(userId?: string): Promise<Conversation[]> {
    await this.ensureLoaded();
    return this.memory.listConversations(userId);
  }

  async deleteConversation(id: string): Promise<void> {
    return this.withPersist(() => this.memory.deleteConversation(id));
  }

  // Tasks
  async getTask(id: string): Promise<Task | undefined> {
    await this.ensureLoaded();
    return this.memory.getTask(id);
  }

  async saveTask(task: Task): Promise<void> {
    return this.withPersist(() => this.memory.saveTask(task));
  }

  async listTasks(conversationId?: string): Promise<Task[]> {
    await this.ensureLoaded();
    return this.memory.listTasks(conversationId);
  }

  // Scheduled tasks
  async listScheduledTasks(): Promise<ScheduledTask[]> {
    await this.ensureLoaded();
    return this.memory.listScheduledTasks();
  }

  async getScheduledTask(id: string): Promise<ScheduledTask | undefined> {
    await this.ensureLoaded();
    return this.memory.getScheduledTask(id);
  }

  async saveScheduledTask(task: ScheduledTask): Promise<void> {
    return this.withPersist(() => this.memory.saveScheduledTask(task));
  }

  async deleteScheduledTask(id: string): Promise<void> {
    return this.withPersist(() => this.memory.deleteScheduledTask(id));
  }

  // Reflections
  async saveReflection(reflection: AgentReflection): Promise<void> {
    return this.withPersist(() => this.memory.saveReflection(reflection));
  }

  async listReflections(agentId?: string): Promise<AgentReflection[]> {
    await this.ensureLoaded();
    return this.memory.listReflections(agentId);
  }

  // Evolutions
  async saveEvolution(evolution: AgentEvolution): Promise<void> {
    return this.withPersist(() => this.memory.saveEvolution(evolution));
  }

  async listEvolutions(agentId?: string): Promise<AgentEvolution[]> {
    await this.ensureLoaded();
    return this.memory.listEvolutions(agentId);
  }

  // Proposals
  async saveProposal(proposal: ImprovementProposal): Promise<void> {
    return this.withPersist(() => this.memory.saveProposal(proposal));
  }

  async getProposal(id: string): Promise<ImprovementProposal | undefined> {
    await this.ensureLoaded();
    return this.memory.getProposal(id);
  }

  async listProposals(status?: ImprovementProposal['status']): Promise<ImprovementProposal[]> {
    await this.ensureLoaded();
    return this.memory.listProposals(status);
  }
}
