/**
 * GET/POST /agents
 *
 * GET:  list all agents
 * POST: { action: 'get' | 'save' | 'delete', ... } manage agents
 */

import { getStore } from '../../shared/store';
import type { AgentDefinition } from '../../shared/types';

export async function onRequest(context: any) {
  const request = context.request;
  const method = request.method ?? 'GET';
  const env = context.env as Record<string, string | undefined>;
  const store = getStore(env);

  try {
    if (method === 'GET') {
      return jsonResponse({ agents: await store.listAgents() });
    }

    const body = request.body ?? {};
    const action = body.action ?? 'get';

    if (action === 'get') {
      const agent = await store.getAgent(body.id);
      return jsonResponse({ agent: agent ?? null });
    }

    if (action === 'save') {
      const agent = body.agent as AgentDefinition;
      if (!agent?.id || !agent.name) {
        return jsonResponse({ error: 'agent.id and agent.name are required' }, 400);
      }
      await store.saveAgent({ ...agent, isBuiltIn: false });
      return jsonResponse({ agent: await store.getAgent(agent.id) });
    }

    if (action === 'delete') {
      const existing = await store.getAgent(body.id);
      if (existing?.isBuiltIn) {
        return jsonResponse({ error: 'Cannot delete built-in agent' }, 400);
      }
      await store.deleteAgent(body.id);
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
