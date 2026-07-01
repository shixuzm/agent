/**
 * GET /evolutions
 *
 * Query parameters:
 *   - agentId: filter by agent
 */

import { getStore } from '../../shared/store';

export async function onRequest(context: any) {
  try {
    const request = context.request;
    const params = request.query ?? request.body ?? {};
    const agentId = params.agentId ? String(params.agentId) : undefined;
    const env = context.env as Record<string, string | undefined>;
    const store = getStore(env);

    const evolutions = await store.listEvolutions(agentId);
    return jsonResponse({ evolutions });
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
