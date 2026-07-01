import type { AgentDefinition } from './types';
import { getStore } from './store';

export { getStore, type Store } from './store';

export async function listAgents(env?: Record<string, unknown>): Promise<AgentDefinition[]> {
  return getStore(env).listAgents();
}

export async function getAgent(id: string, env?: Record<string, unknown>): Promise<AgentDefinition | undefined> {
  return getStore(env).getAgent(id);
}

export async function saveAgent(agent: AgentDefinition, env?: Record<string, unknown>): Promise<void> {
  return getStore(env).saveAgent(agent);
}

export async function deleteAgent(id: string, env?: Record<string, unknown>): Promise<void> {
  return getStore(env).deleteAgent(id);
}

export async function getBuiltInAgents(env?: Record<string, unknown>): Promise<AgentDefinition[]> {
  return (await listAgents(env)).filter(a => a.isBuiltIn);
}

export async function getSpecialistAgents(env?: Record<string, unknown>): Promise<AgentDefinition[]> {
  return (await listAgents(env)).filter(a => a.isBuiltIn && a.role !== 'super');
}
