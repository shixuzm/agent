/**
 * GET/POST /agents
 *
 * GET:  list all agents
 * POST: { action: 'get' | 'save' | 'delete', ... } manage agents
 */

import { listAgents, getAgent, saveAgent, deleteAgent } from '../../shared/agents';
import type { AgentDefinition } from '../../shared/types';

export async function onRequest(context: any) {
  const request = context.request;
  const method = request.method ?? 'GET';

  try {
    if (method === 'GET') {
      return jsonResponse({ agents: listAgents() });
    }

    const body = request.body ?? {};
    const action = body.action ?? 'get';

    if (action === 'get') {
      const agent = getAgent(body.id);
      return jsonResponse({ agent: agent ?? null });
    }

    if (action === 'save') {
      const agent = body.agent as AgentDefinition;
      if (!agent?.id || !agent.name) {
        return jsonResponse({ error: 'agent.id and agent.name are required' }, 400);
      }
      saveAgent({ ...agent, isBuiltIn: false });
      return jsonResponse({ agent: getAgent(agent.id) });
    }

    if (action === 'delete') {
      const existing = getAgent(body.id);
      if (existing?.isBuiltIn) {
        return jsonResponse({ error: 'Cannot delete built-in agent' }, 400);
      }
      deleteAgent(body.id);
      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
