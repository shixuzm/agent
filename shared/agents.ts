import type { AgentDefinition } from './types';
import { getStore } from './store';

export { getStore } from './store';

export function listAgents(): AgentDefinition[] {
  return getStore().listAgents();
}

export function getAgent(id: string): AgentDefinition | undefined {
  return getStore().getAgent(id);
}

export function saveAgent(agent: AgentDefinition): void {
  getStore().saveAgent(agent);
}

export function deleteAgent(id: string): void {
  getStore().deleteAgent(id);
}

export function getBuiltInAgents(): AgentDefinition[] {
  return listAgents().filter(a => a.isBuiltIn);
}

export function getSpecialistAgents(): AgentDefinition[] {
  return listAgents().filter(a => a.isBuiltIn && a.role !== 'super');
}
