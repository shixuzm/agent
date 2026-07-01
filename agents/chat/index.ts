/**
 * Agent handler — EdgeOne Makers
 * ========================================
 *
 * File path agents/chat/index.ts maps to **POST /chat**
 *
 * This handler is the main entry point for the multi-agent system.
 * It uses the SuperAgent orchestrator to route user messages to the
 * most appropriate specialist agent.
 */

import { createLogger } from '../_logger';
import { sseResponse } from '../_sse';
import { planAndExecute, type OrchestratorInput } from '../../shared/orchestrator';
import { getStore } from '../../shared/store';
import { randomUUID } from '../_utils';

const logger = createLogger('chat');

export async function onRequest(context: any) {
  const body = context.request.body ?? {};
  const message = body.message as string | undefined;
  if (!message) {
    return new Response(
      JSON.stringify({ error: "'message' is required" }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const rawUserId = typeof body.userId === 'string'
    ? body.userId
    : (typeof body.user_id === 'string' ? body.user_id : '');
  const userId = rawUserId.trim() || undefined;

  const conversationId: string = context.conversation_id ?? '';
  const signal: AbortSignal | undefined = context.request.signal;

  logger.log(`[request] cid=${conversationId}, uid=${userId ?? '-'}, message="${message.slice(0, 50)}..."`);

  // Ensure conversation exists in our store
  const store = getStore();
  let conversation = conversationId ? store.getConversation(conversationId) : undefined;
  if (!conversation && conversationId) {
    conversation = {
      id: conversationId,
      userId,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    store.saveConversation(conversation);
  }

  // Record user message
  if (conversation) {
    conversation.messages.push({
      id: randomUUID(),
      conversationId: conversation.id,
      role: 'user',
      content: message,
      timestamp: Date.now(),
    });
    conversation.updatedAt = Date.now();
    store.saveConversation(conversation);
  }

  const env = context.env as Record<string, string | undefined>;
  const input: OrchestratorInput = {
    message,
    conversationId: conversationId || 'default',
    userId,
    preferredAgentId: body.agentId,
  };

  return sseResponse(
    async function* () {
      try {
        const result = await planAndExecute(env, input);

        // Yield structured metadata event first
        yield {
          event: 'agent_selected',
          data: { agentId: result.agentId, agentName: result.agentName, reasoning: result.reasoning },
        };

        // Stream response text in chunks for better UX
        const chunkSize = 20;
        const text = result.response;
        for (let i = 0; i < text.length; i += chunkSize) {
          if (signal?.aborted) break;
          yield {
            event: 'text_delta',
            data: { delta: text.slice(i, i + chunkSize) },
          };
          // Tiny delay to simulate streaming
          await new Promise(r => setTimeout(r, 5));
        }

        if (!signal?.aborted) {
          yield { event: 'done', data: {} };
        }
      } catch (e) {
        logger.error('[chat] orchestrator failed:', e);
        yield {
          event: 'error',
          data: { message: e instanceof Error ? e.message : String(e) },
        };
      }
    },
    { signal, logger },
  );
}
