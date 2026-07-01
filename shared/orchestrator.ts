import type { AgentDefinition, OrchestratorInput, Task } from './types';
import { getAgent, getSpecialistAgents } from './agents';
import { chatCompletion } from './llm';
import { getSkillDescriptionsForAgent, executeSkill } from './skills';
import { getStore } from './store';
import { randomUUID } from '../agents/_utils';

export interface OrchestratorResult {
  agentId: string;
  agentName: string;
  taskId: string;
  reasoning: string;
  response: string;
}

/**
 * Simple intent-based agent selection.
 * For complex tasks, use planAndExecute below.
 */
export async function selectAgent(
  env: Record<string, string | undefined>,
  message: string,
  preferredAgentId?: string,
): Promise<{ agent: AgentDefinition; reasoning: string }> {
  if (preferredAgentId) {
    const agent = getAgent(preferredAgentId);
    if (agent) {
      return { agent, reasoning: `用户指定使用 ${agent.name}` };
    }
  }

  const superAgent = getAgent('agent_super');
  if (!superAgent) {
    throw new Error('Super agent not found in registry');
  }

  const specialists = getSpecialistAgents();
  const agentDescriptions = specialists
    .map(a => `- ${a.name}（${a.role}）：${a.description}`)
    .join('\n');

  const prompt = `你是智能体调度器。请根据用户请求，从以下专项智能体中选择最合适的一个，并说明理由。\n\n可选智能体：\n${agentDescriptions}\n\n用户请求："""${message}"""\n\n请只返回 JSON 格式：{"agentId": "", "reasoning": ""}`;

  const json = await chatCompletion(env, [
    { role: 'system', content: superAgent.systemPrompt },
    { role: 'user', content: prompt },
  ]);

  let selectedId: string | undefined;
  try {
    const parsed = JSON.parse(json.replace(/```json|```/g, '').trim());
    selectedId = parsed.agentId;
  } catch {
    // ignore parse error
  }

  const selected = selectedId ? specialists.find(a => a.id === selectedId) : undefined;
  if (selected) {
    return { agent: selected, reasoning: `调度器选择 ${selected.name}` };
  }

  // Fallback: keyword matching
  const lower = message.toLowerCase();
  if (lower.includes('代码') || lower.includes('编程') || lower.includes('function') || lower.includes('bug')) {
    const coder = getAgent('agent_coder');
    if (coder) return { agent: coder, reasoning: '请求包含编程相关关键词，匹配代码智能体' };
  }
  if (lower.includes('写') || lower.includes('文章') || lower.includes('报告') || lower.includes('邮件') || lower.includes('文案')) {
    const writer = getAgent('agent_writer');
    if (writer) return { agent: writer, reasoning: '请求包含写作相关关键词，匹配写作智能体' };
  }
  if (lower.includes('分析') || lower.includes('研究') || lower.includes('资料') || lower.includes('检索')) {
    const researcher = getAgent('agent_researcher');
    if (researcher) return { agent: researcher, reasoning: '请求包含研究分析关键词，匹配研究智能体' };
  }

  return { agent: superAgent, reasoning: '未匹配到专项智能体，由主智能体直接处理' };
}

/**
 * Execute a single agent task.
 */
export async function executeAgentTask(
  env: Record<string, string | undefined>,
  agent: AgentDefinition,
  taskInput: string,
  conversationContext: string,
): Promise<string> {
  const skillDescriptions = getSkillDescriptionsForAgent(agent.skillIds);

  const systemPrompt = `${agent.systemPrompt}\n\n你可以使用以下技能（当前为模拟实现）：\n${skillDescriptions}\n\n如果用户的请求明显需要某个技能，你可以在回复中说明要调用该技能，但不要输出 JSON 格式。直接给出最终答案。`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: `对话上下文：\n${conversationContext}\n\n当前任务：${taskInput}` },
  ];

  return chatCompletion(env, messages, agent.modelConfig);
}

/**
 * Plan a complex task into subtasks and execute them.
 * MVP: only decomposes when explicitly requested or when the message contains multiple distinct tasks.
 */
export async function planAndExecute(
  env: Record<string, string | undefined>,
  input: OrchestratorInput,
): Promise<OrchestratorResult> {
  const store = getStore();
  const conversation = store.getConversation(input.conversationId);
  const contextMessages = conversation?.messages ?? [];
  const contextText = contextMessages
    .slice(-10)
    .map(m => `${m.role}: ${m.content}`)
    .join('\n');

  // Step 1: select agent
  const { agent, reasoning } = await selectAgent(env, input.message, input.preferredAgentId);

  // Step 2: create and save task
  const taskId = randomUUID();
  const task: Task = {
    id: taskId,
    agentId: agent.id,
    status: 'running',
    input: input.message,
    createdAt: Date.now(),
  };
  store.saveTask(task);

  // Step 3: execute task
  let response: string;
  try {
    response = await executeAgentTask(env, agent, input.message, contextText);
    task.status = 'completed';
    task.output = response;
    task.completedAt = Date.now();
  } catch (e) {
    task.status = 'failed';
    task.error = e instanceof Error ? e.message : String(e);
    response = `任务执行失败：${task.error}`;
  }
  store.saveTask(task);

  // Step 4: save message to conversation
  if (conversation) {
    conversation.messages.push({
      id: randomUUID(),
      conversationId: conversation.id,
      role: 'assistant',
      content: response,
      agentId: agent.id,
      taskId,
      timestamp: Date.now(),
    });
    conversation.updatedAt = Date.now();
    store.saveConversation(conversation);
  }

  return {
    agentId: agent.id,
    agentName: agent.name,
    taskId,
    reasoning,
    response,
  };
}
