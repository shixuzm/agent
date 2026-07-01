/**
 * Backend API (EdgeOne Makers)
 *
 * Route mapping (file → route):
 *   agents/chat/index.ts                         → POST /chat                  Main chat endpoint (SSE)
 *   agents/stop/index.ts                         → POST /stop                  Abort the active agent run
 *   cloud-functions/history/index.ts             → POST /history               Get conversation history
 *   cloud-functions/conversations/index.ts       → POST /conversations         List conversations for a user
 *   cloud-functions/clear-history/index.ts       → POST /clear-history         Clear messages of one conversation
 *   cloud-functions/delete-conversation/index.ts → POST /delete-conversation   Permanently delete a conversation
 *   cloud-functions/agents/index.ts              → GET/POST /agents            Agent management
 *   cloud-functions/skills/index.ts              → GET/POST /skills            Skill management
 *
 * This file defines all API paths and request wrappers.
 *
 * 双模式 API 层：
 *   - Web/本地开发模式：通过 fetch 调用后端 EdgeOne Makers 的 SSE/REST 端点。
 *   - 移动端直连模式（Capacitor WebView 或 VITE_DIRECT_LLM=true）：
 *     前端直接调用 shared/llm.ts 的 chatCompletion 与 shared/store.ts 的
 *     MemoryStore，不依赖后端 cloud-functions / agents。
 *     shared 模块通过动态 import 加载，避免在 Web 模式下被打包进 bundle。
 *     不导入 shared/skills.ts 或 shared/orchestrator.ts（依赖 Node.js fs）。
 */

import type {
  Message,
  ListConversationsParams,
  ListConversationsResponse,
  AgentDefinition,
  SkillDefinition,
} from './types';

export const API = {
  chat: '/chat',
  chatStop: '/stop',                        // Abort the active agent run
  history: '/history',                      // Get conversation history
  clearHistory: '/clear-history',           // Clear messages in a conversation
  conversations: '/conversations',          // List conversations for a user
  deleteConversation: '/delete-conversation', // Permanently delete a conversation
  agents: '/agents',                        // Agent management
  skills: '/skills',                        // Skill management
  reflections: '/reflections',              // Agent self-reflections
  evolutions: '/evolutions',                // Agent evolution history
  proposals: '/proposals',                  // Self-improvement proposals
} as const;

export interface RawSseEvent {
  eventType: string;
  data: unknown;
  raw: string;
  timestamp: number;
}

export interface AgentSelectedEvent {
  agentId: string;
  agentName: string;
  reasoning: string;
}

export interface StreamCallbacks {
  onTextDelta: (delta: string) => void;
  onToolCalled: (toolName: string) => void;
  onAgentSelected?: (event: AgentSelectedEvent) => void;
  onDone: () => void;
  onError: (err: Error) => void;
  onRawEvent?: (event: RawSseEvent) => void;
}

// ── 直连模式环境检测 ───────────────────────────────────────────
// 当运行在 Capacitor 原生 WebView 或显式启用 VITE_DIRECT_LLM 时，
// 前端将跳过后端服务，直接调用 shared/llm.ts 与 shared/store.ts。
const isNativeApp = typeof window !== 'undefined'
  && ((window as unknown as { capacitor?: { isNative?: boolean } }).capacitor?.isNative ?? false);
export const USE_DIRECT_LLM: boolean = isNativeApp || import.meta.env.VITE_DIRECT_LLM === 'true';

// 直连模式专用的 MemoryStore 单例（懒加载）。
// 使用 MemoryStore 而非 getStore() 是为了避免在浏览器中触发 KVStore
// 的异步加载逻辑（浏览器无 KV binding，最终也会 fallback 到 MemoryStore）。
// 同一进程内所有直连 API 共享同一实例，确保 sendMessageStream 写入的
// 对话能被 listConversations / fetchConversationHistory 读到。
type DirectStore = import('../shared/store').MemoryStore;
let _directStore: DirectStore | null = null;

async function getDirectStore(): Promise<DirectStore> {
  if (!_directStore) {
    const { MemoryStore } = await import('../shared/store');
    _directStore = new MemoryStore();
  }
  return _directStore;
}

// ── 直连模式辅助：将 shared/types.Message 转换为 src/types.Message ──
// shared 的 Message.role 包含 'system' | 'tool'，src 的只允许 'user' | 'assistant'。
// 这里过滤掉非 user/assistant 的消息，并保留前端需要的字段。
type SharedMessage = import('../shared/types').Message;
function toFrontendMessage(m: SharedMessage): Message | null {
  if (m.role !== 'user' && m.role !== 'assistant') return null;
  return {
    id: m.id,
    role: m.role,
    content: m.content,
    timestamp: m.timestamp,
    agentId: m.agentId,
  };
}

/** Get conversation history for restoring the chat window after page refresh. */
export async function fetchConversationHistory(
  conversationId: string,
  userId?: string,
): Promise<Message[]> {
  if (USE_DIRECT_LLM) {
    try {
      if (!conversationId) return [];
      const store = await getDirectStore();
      const conv = await store.getConversation(conversationId);
      if (!conv) return [];
      return conv.messages
        .map(toFrontendMessage)
        .filter((m): m is Message => m !== null);
    } catch (e) {
      console.warn('[history] direct mode failed:', e);
      return [];
    }
  }

  const startTime = Date.now();
  console.log(`[History] Request start time: ${new Date(startTime).toLocaleString()}`);

  try {
    const res = await fetch(API.history, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversation_id: conversationId, user_id: userId }),
    });

    if (!res.ok) {
      const endTime = Date.now();
      console.log(`[History] Request end time: ${new Date(endTime).toLocaleString()}`);
      console.log(`[History] Total time: ${endTime - startTime}ms`);
      return [];
    }

    const data = await res.json().catch(() => null) as { messages?: Message[] } | null;
    const endTime = Date.now();
    console.log(`[History] Request end time: ${new Date(endTime).toLocaleString()}`);
    console.log(`[History] Total time: ${endTime - startTime}ms`);
    return Array.isArray(data?.messages) ? data.messages : [];
  } catch {
    const endTime = Date.now();
    console.log(`[History] Request end time: ${new Date(endTime).toLocaleString()}`);
    console.log(`[History] Total time: ${endTime - startTime}ms (aborted with error)`);
    return [];
  }
}

/**
 * 直连模式：直接在前端调用 chatCompletion 完成单轮对话，不依赖后端 orchestrator。
 *
 * 简化策略（详见 Task 6 设计文档 6.2）：
 *   - 跳过 orchestrator 的任务规划和智能体选择
 *   - 使用当前选中的智能体（options.agentId，缺省为主智能体）的 systemPrompt 构造 messages
 *   - 拼接最近 10 条对话历史作为上下文
 *   - chatCompletion 当前返回完整字符串，因此先一次性取回，再分块通过 onTextDelta 模拟流式
 *
 * 完成后将 user + assistant 两条消息写回 MemoryStore，以便后续 history / listConversations 读取。
 */
async function runDirectChatStream(
  message: string,
  callbacks: StreamCallbacks,
  conversationId: string | undefined,
  options: { userId?: string; userMsgId?: string; botMsgId?: string; agentId?: string } | undefined,
  ctrl: AbortController,
): Promise<void> {
  try {
    if (ctrl.signal.aborted) return;

    const { chatCompletion } = await import('../shared/llm');
    const store = await getDirectStore();

    // 1. 选择智能体：使用 options.agentId，否则 fallback 到主智能体
    const agentId = options?.agentId ?? 'agent_super';
    const agent = await store.getAgent(agentId);
    if (!agent) {
      callbacks.onError(new Error(`Agent not found: ${agentId}`));
      return;
    }

    // 2. 准备对话上下文（最近 10 条 user/assistant 消息）
    const convId = conversationId ?? 'default';
    const existingConv = await store.getConversation(convId);
    const historyMessages = (existingConv?.messages ?? [])
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-10)
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    // 3. 发送 agent_selected 事件（让 UI 显示当前使用的智能体）
    if (callbacks.onAgentSelected) {
      callbacks.onAgentSelected({
        agentId: agent.id,
        agentName: agent.name,
        reasoning: '直连模式：使用当前选中的智能体',
      });
    }
    if (callbacks.onRawEvent) {
      callbacks.onRawEvent({
        eventType: 'agent_selected',
        data: { agentId: agent.id, agentName: agent.name, reasoning: '直连模式' },
        raw: JSON.stringify({ agentId: agent.id, agentName: agent.name }),
        timestamp: Date.now(),
      });
    }

    // 4. 调用 chatCompletion（非流式）
    const messages: import('../shared/llm').ChatMessage[] = [
      { role: 'system', content: agent.systemPrompt },
      ...historyMessages,
      { role: 'user', content: message },
    ];

    const response = await chatCompletion({}, messages, agent.modelConfig);

    if (ctrl.signal.aborted) return;

    // 5. 模拟流式输出：将完整回复分块通过 onTextDelta 推送
    const chunkSize = 20;
    for (let i = 0; i < response.length; i += chunkSize) {
      if (ctrl.signal.aborted) return;
      const delta = response.slice(i, i + chunkSize);
      callbacks.onTextDelta(delta);
      if (callbacks.onRawEvent) {
        callbacks.onRawEvent({
          eventType: 'text_delta',
          data: { delta },
          raw: JSON.stringify({ delta }),
          timestamp: Date.now(),
        });
      }
      // 轻微延迟，模拟真实流式节奏
      await new Promise(r => setTimeout(r, 5));
    }

    // 6. 将 user + assistant 两条消息写回 MemoryStore
    const now = Date.now();
    const conv = existingConv ?? {
      id: convId,
      userId: options?.userId,
      messages: [] as import('../shared/types').Message[],
      createdAt: now,
      updatedAt: now,
    };
    conv.messages.push(
      {
        id: options?.userMsgId ?? `msg-${now}-u`,
        conversationId: convId,
        role: 'user',
        content: message,
        timestamp: now,
      },
      {
        id: options?.botMsgId ?? `msg-${now}-a`,
        conversationId: convId,
        role: 'assistant',
        content: response,
        agentId: agent.id,
        timestamp: now + 1,
      },
    );
    conv.updatedAt = now;
    await store.saveConversation(conv);

    // 7. 发送 done 事件
    if (callbacks.onRawEvent) {
      callbacks.onRawEvent({
        eventType: 'done',
        data: {},
        raw: '{}',
        timestamp: Date.now(),
      });
    }
    callbacks.onDone();
  } catch (err) {
    // AbortError 不触发错误回调（与 Web 模式行为保持一致）
    if (err instanceof DOMException && err.name === 'AbortError') return;
    callbacks.onError(err instanceof Error ? err : new Error(String(err)));
  }
}

/**
 * Stream POST /chat via SSE
 * Backend pushes events: agent_selected / text_delta / tool_called / done / error
 *
 * Returns an AbortController the caller can use to abort (or pair with /chat/stop for graceful abort).
 *
 * 直连模式（USE_DIRECT_LLM=true）下，跳过后端 SSE 端点，直接在前端调用
 * shared/llm.ts 的 chatCompletion。chatCompletion 当前是非流式调用，
 * 因此先把完整回复一次性取回，再以小块（chunkSize）通过 onTextDelta 模拟流式输出。
 */
export function sendMessageStream(
  message: string,
  callbacks: StreamCallbacks,
  conversationId?: string,
  options?: { userId?: string; userMsgId?: string; botMsgId?: string; agentId?: string },
): AbortController {
  const ctrl = new AbortController();

  if (USE_DIRECT_LLM) {
    void runDirectChatStream(message, callbacks, conversationId, options, ctrl);
    return ctrl;
  }

  (async () => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (conversationId) {
        headers['makers-conversation-id'] = conversationId;
      }

      const res = await fetch(API.chat, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message,
          userId: options?.userId,
          userMsgId: options?.userMsgId,
          botMsgId: options?.botMsgId,
          agentId: options?.agentId,
        }),
        signal: ctrl.signal,
      });

      if (!res.ok) {
        callbacks.onError(new Error(`HTTP ${res.status}: ${await res.text().catch(() => '')}`));
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        callbacks.onError(new Error('ReadableStream not supported'));
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let doneReceived = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE format: events separated by \n\n
        const parts = buffer.split('\n\n');
        // Last segment may be incomplete — keep in buffer
        buffer = parts.pop() || '';

        for (const part of parts) {
          if (!part.trim()) continue;
          dispatchSseChunk(part, callbacks, () => { doneReceived = true; });
        }
      }

      // Fallback: trigger done only if backend did not send done event
      if (!doneReceived) {
        callbacks.onDone();
      }
    } catch (err) {
      // AbortError does not trigger error callback
      if (err instanceof DOMException && err.name === 'AbortError') return;
      callbacks.onError(err instanceof Error ? err : new Error(String(err)));
    }
  })();

  return ctrl;
}

/** Parse a single SSE event and dispatch to the corresponding callback */
function dispatchSseChunk(part: string, cb: StreamCallbacks, markDone: () => void): void {
  let eventType = '';
  let data = '';

  for (const line of part.split('\n')) {
    if (line.startsWith('event: ')) {
      eventType = line.slice(7);
    } else if (line.startsWith('data: ')) {
      data = line.slice(6);
    }
  }

  if (!eventType || !data) return;

  try {
    const parsed = JSON.parse(data);

    if (cb.onRawEvent) {
      cb.onRawEvent({
        eventType,
        data: parsed,
        raw: data,
        timestamp: Date.now(),
      });
    }

    switch (eventType) {
      case 'text_delta':
        cb.onTextDelta(parsed.delta);
        break;
      case 'tool_called':
        cb.onToolCalled(parsed.tool);
        break;
      case 'agent_selected':
        if (cb.onAgentSelected) {
          cb.onAgentSelected(parsed as AgentSelectedEvent);
        }
        break;
      case 'error':
        cb.onError(new Error(parsed.message || 'agent returned error'));
        break;
      case 'done':
        markDone();
        cb.onDone();
        break;
    }
  } catch {
    if (cb.onRawEvent) {
      cb.onRawEvent({
        eventType,
        data: null,
        raw: data,
        timestamp: Date.now(),
      });
    }
  }
}

/**
 * Request the backend to abort the currently running agent.
 *
 * 直连模式下没有后端运行中的 agent，直接返回 true（abort 由调用方
 * 通过 AbortController.abort() 完成）。
 */
export async function stopAgent(conversationId?: string): Promise<boolean> {
  if (USE_DIRECT_LLM) {
    // 直连模式下，abort 通过 sendMessageStream 返回的 AbortController 完成。
    // 这里仅返回 true 表示「无后端可停止」，避免 UI 误报失败。
    void conversationId;
    return true;
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (conversationId) {
      headers['makers-conversation-id'] = conversationId;
    }
    const res = await fetch(API.chatStop, {
      method: 'POST',
      headers,
      body: JSON.stringify({ conversation_id: conversationId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Clear backend conversation history for the given conversation ID. */
export async function clearConversationHistory(
  conversationId?: string,
  userId?: string,
): Promise<boolean> {
  if (!conversationId) return false;

  if (USE_DIRECT_LLM) {
    try {
      const store = await getDirectStore();
      // 与后端 clear-history 行为一致：清空消息并重置 conversation（保留 id）。
      const now = Date.now();
      await store.saveConversation({
        id: conversationId,
        userId,
        messages: [],
        createdAt: now,
        updatedAt: now,
      });
      return true;
    } catch (e) {
      console.warn('[clear-history] direct mode failed:', e);
      return false;
    }
  }

  try {
    const res = await fetch(API.clearHistory, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: conversationId, user_id: userId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * List conversations for the given user (eo-uuid).
 */
export async function listConversations(
  params: ListConversationsParams,
): Promise<ListConversationsResponse> {
  if (USE_DIRECT_LLM) {
    try {
      const store = await getDirectStore();
      const all = await store.listConversations(params.userId);
      // 按 updatedAt 倒序（与后端默认 order=desc 保持一致）
      const sorted = [...all].sort((a, b) => b.updatedAt - a.updatedAt);
      const limit = params.limit && params.limit > 0 ? params.limit : sorted.length;
      const conversations = sorted.slice(0, limit).map(c => {
        const firstUser = c.messages.find(m => m.role === 'user')?.content ?? '';
        const title = c.title?.trim()
          || (firstUser ? firstUser.replace(/\s+/g, ' ').trim().slice(0, 8) : 'New chat');
        const lastMsg = c.messages[c.messages.length - 1];
        return {
          id: c.id,
          title,
          preview: lastMsg?.content,
          lastMessageAt: c.updatedAt,
          createdAt: c.createdAt,
          userId: c.userId,
          messageCount: c.messages.length,
        };
      });
      return { conversations };
    } catch (e) {
      console.warn('[conversations] direct mode failed:', e);
      return { conversations: [] };
    }
  }

  const startTime = performance.now();
  console.log(`[conversations] start: ${new Date().toISOString()}`);

  const empty: ListConversationsResponse = { conversations: [] };

  try {
    const res = await fetch(API.conversations, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: params.userId,
        limit: params.limit,
        order: params.order,
        after: params.after,
        before: params.before,
      }),
    });

    if (!res.ok) {
      console.warn(`[conversations] HTTP ${res.status}`);
      console.log(`[conversations] end: ${new Date().toISOString()}, total: ${(performance.now() - startTime).toFixed(2)}ms`);
      return empty;
    }

    const data = (await res.json().catch(() => null)) as ListConversationsResponse | null;
    console.log(`[conversations] end: ${new Date().toISOString()}, total: ${(performance.now() - startTime).toFixed(2)}ms, count=${data?.conversations?.length ?? 0}`);
    if (!data || !Array.isArray(data.conversations)) return empty;
    return {
      conversations: data.conversations,
      nextCursor: data.nextCursor,
      previousCursor: data.previousCursor,
    };
  } catch (e) {
    console.warn('[conversations] request failed:', e);
    return empty;
  }
}

/** Permanently delete a conversation (irreversible). */
export async function deleteConversation(
  conversationId: string,
  userId?: string,
): Promise<boolean> {
  if (!conversationId) return false;

  if (USE_DIRECT_LLM) {
    try {
      const store = await getDirectStore();
      await store.deleteConversation(conversationId);
      return true;
    } catch (e) {
      console.warn('[delete-conversation] direct mode failed:', e);
      return false;
    }
  }

  void userId; // 仅保持参数与 Web 模式一致；后端通过 body 接收 user_id
  try {
    const res = await fetch(API.deleteConversation, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: conversationId, user_id: userId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** List all agents. */
export async function listAgents(): Promise<AgentDefinition[]> {
  if (USE_DIRECT_LLM) {
    try {
      const store = await getDirectStore();
      const agents = await store.listAgents();
      // shared/types.AgentDefinition 是 src/types.AgentDefinition 的超集
      // （多出 modelConfig?/knowledgeBaseIds?/toolPermissions? 等可选字段），
      // 结构子类型兼容，可直接返回。
      return agents as AgentDefinition[];
    } catch (e) {
      console.warn('[agents] direct mode failed:', e);
      return [];
    }
  }

  try {
    const res = await fetch(API.agents, { method: 'GET' });
    if (!res.ok) return [];
    const data = (await res.json().catch(() => null)) as { agents?: AgentDefinition[] } | null;
    return data?.agents ?? [];
  } catch {
    return [];
  }
}

/** List all skills. */
export async function listSkills(): Promise<SkillDefinition[]> {
  if (USE_DIRECT_LLM) {
    try {
      const store = await getDirectStore();
      const skills = await store.listSkills();
      // shared/types.SkillDefinition 是 src/types.SkillDefinition 的超集。
      return skills as SkillDefinition[];
    } catch (e) {
      console.warn('[skills] direct mode failed:', e);
      return [];
    }
  }

  try {
    const res = await fetch(API.skills, { method: 'GET' });
    if (!res.ok) return [];
    const data = (await res.json().catch(() => null)) as { skills?: SkillDefinition[] } | null;
    return data?.skills ?? [];
  } catch {
    return [];
  }
}

/** Create or update an agent. */
export async function saveAgent(agent: AgentDefinition): Promise<AgentDefinition | null> {
  if (USE_DIRECT_LLM) {
    try {
      const store = await getDirectStore();
      // 与后端 cloud-functions/agents/index.ts 行为一致：保存时强制 isBuiltIn=false。
      const toSave = { ...agent, isBuiltIn: false, updatedAt: Date.now() };
      await store.saveAgent(toSave as import('../shared/types').AgentDefinition);
      const saved = await store.getAgent(agent.id);
      return (saved as AgentDefinition | undefined) ?? null;
    } catch (e) {
      console.warn('[save-agent] direct mode failed:', e);
      return null;
    }
  }

  try {
    const res = await fetch(API.agents, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save', skill: undefined, agent }),
    });
    if (!res.ok) return null;
    const data = (await res.json().catch(() => null)) as { agent?: AgentDefinition } | null;
    return data?.agent ?? null;
  } catch {
    return null;
  }
}

/** Delete an agent. Built-in agents cannot be deleted. */
export async function deleteAgent(id: string): Promise<boolean> {
  if (USE_DIRECT_LLM) {
    try {
      const store = await getDirectStore();
      const existing = await store.getAgent(id);
      // 与后端行为一致：内置智能体不允许删除。
      if (existing?.isBuiltIn) return false;
      await store.deleteAgent(id);
      return true;
    } catch (e) {
      console.warn('[delete-agent] direct mode failed:', e);
      return false;
    }
  }

  try {
    const res = await fetch(API.agents, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** List reflections, optionally filtered by agent. */
export async function listReflections(agentId?: string) {
  // 直连模式下，reflections 由后端 orchestrator 的 triggerSelfGrowth 异步生成。
  // 由于浏览器中无法运行 orchestrator（依赖 skills.ts 的 fs），直接返回空数组。
  // 后续可由浏览器兼容的轻量 orchestrator 写入 MemoryStore 后再读取。
  if (USE_DIRECT_LLM) {
    void agentId;
    return [];
  }

  try {
    const qs = agentId ? `?agentId=${encodeURIComponent(agentId)}` : '';
    const res = await fetch(`${API.reflections}${qs}`, { method: 'GET' });
    if (!res.ok) return [];
    const data = (await res.json().catch(() => null)) as { reflections?: unknown[] } | null;
    return data?.reflections ?? [];
  } catch {
    return [];
  }
}

/** List evolutions, optionally filtered by agent. */
export async function listEvolutions(agentId?: string) {
  // 直连模式下无 evolutions（同 listReflections 的理由）。
  if (USE_DIRECT_LLM) {
    void agentId;
    return [];
  }

  try {
    const qs = agentId ? `?agentId=${encodeURIComponent(agentId)}` : '';
    const res = await fetch(`${API.evolutions}${qs}`, { method: 'GET' });
    if (!res.ok) return [];
    const data = (await res.json().catch(() => null)) as { evolutions?: unknown[] } | null;
    return data?.evolutions ?? [];
  } catch {
    return [];
  }
}

/** List improvement proposals. */
export async function listProposals(status?: string) {
  // 直连模式下无 proposals（同 listReflections 的理由）。
  if (USE_DIRECT_LLM) {
    void status;
    return [];
  }

  try {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await fetch(`${API.proposals}${qs}`, { method: 'GET' });
    if (!res.ok) return [];
    const data = (await res.json().catch(() => null)) as { proposals?: unknown[] } | null;
    return data?.proposals ?? [];
  } catch {
    return [];
  }
}
