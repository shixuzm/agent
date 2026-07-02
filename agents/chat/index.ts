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
import { estimateTokens, getContextWindow } from '../../shared/context/budget.js';
import { randomUUID } from '../_utils';
import type { Conversation } from '../../shared/types';

const logger = createLogger('chat');

function createConversation(id: string, userId?: string): Conversation {
  return {
    id,
    userId,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

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

  const env = context.env as Record<string, string | undefined>;
  const store = getStore(env);

  // Ensure conversation exists in our store
  const conversation = conversationId
    ? (await store.getConversation(conversationId)) ?? createConversation(conversationId, userId)
    : undefined;

  // Record user message
  const userMessage = {
    id: randomUUID(),
    conversationId: conversation?.id ?? conversationId ?? 'default',
    role: 'user' as const,
    content: message,
    timestamp: Date.now(),
    tokenCount: estimateTokens(message),
  };

  if (conversation) {
    conversation.messages.push(userMessage);
    conversation.updatedAt = Date.now();
    conversation.modelName = conversation.modelName ?? body.modelName ?? '@makers/deepseek-v4-flash';
    conversation.contextWindow = conversation.contextWindow ?? getContextWindow(conversation.modelName);
    await store.saveConversation(conversation);
  }

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

        // Persist token usage and metadata if conversation exists
        if (conversation && result.tokenUsage) {
          conversation.tokenUsage = result.tokenUsage;
          conversation.modelName = conversation.modelName ?? body.modelName ?? '@makers/deepseek-v4-flash';
          conversation.contextWindow = conversation.contextWindow ?? getContextWindow(conversation.modelName);
          await store.saveConversation(conversation);
        }

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
