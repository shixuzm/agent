/**
 * GET/POST /proposals
 *
 * GET:
 *   - status: proposed | applied | rejected
 * GET by id:
 *   - id: proposal id
 * POST:
 *   - action: apply | reject
 *   - id: proposal id
 */

import { getStore } from '../../shared/store';
import type { ImprovementProposal } from '../../shared/types';

export async function onRequest(context: any) {
  const request = context.request;
  const method = request.method ?? 'GET';
  const env = context.env as Record<string, string | undefined>;
  const store = getStore(env);

  try {
    if (method === 'GET') {
      const params = request.query ?? request.body ?? {};
      if (params.id) {
        return jsonResponse({ proposal: (await store.getProposal(String(params.id))) ?? null });
      }
      const status = params.status as ImprovementProposal['status'] | undefined;
      return jsonResponse({ proposals: await store.listProposals(status) });
    }

    if (method === 'POST') {
      const body = request.body ?? {};
      const action = body.action ?? 'get';
      const proposal = await store.getProposal(String(body.id));
      if (!proposal) {
        return jsonResponse({ error: 'Proposal not found' }, 404);
      }

      if (action === 'apply') {
        proposal.status = 'applied';
        proposal.appliedAt = Date.now();
      } else if (action === 'reject') {
        proposal.status = 'rejected';
      } else {
        return jsonResponse({ error: `Unknown action: ${action}` }, 400);
      }

      await store.saveProposal(proposal);
      return jsonResponse({ proposal });
    }

    return jsonResponse({ error: 'Method not allowed' }, 405);
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
