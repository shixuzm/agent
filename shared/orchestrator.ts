import type { AgentDefinition, OrchestratorInput, Task, ImprovementProposal } from './types';
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
    const agent = await getAgent(preferredAgentId, env);
    if (agent) {
      return { agent, reasoning: `用户指定使用 ${agent.name}` };
    }
  }

  const superAgent = await getAgent('agent_super', env);
  if (!superAgent) {
    throw new Error('Super agent not found in registry');
  }

  const specialists = await getSpecialistAgents(env);
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
    const coder = await getAgent('agent_coder', env);
    if (coder) return { agent: coder, reasoning: '请求包含编程相关关键词，匹配代码智能体' };
  }
  if (lower.includes('写') || lower.includes('文章') || lower.includes('报告') || lower.includes('邮件') || lower.includes('文案')) {
    const writer = await getAgent('agent_writer', env);
    if (writer) return { agent: writer, reasoning: '请求包含写作相关关键词，匹配写作智能体' };
  }
  if (lower.includes('分析') || lower.includes('研究') || lower.includes('资料') || lower.includes('检索')) {
    const researcher = await getAgent('agent_researcher', env);
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
  const skillDescriptions = await getSkillDescriptionsForAgent(agent.skillIds, env);

  const systemPrompt = `${agent.systemPrompt}\n\n你可以使用以下技能（当前为模拟实现，如需调用可在回复中说明）：\n${skillDescriptions}\n\n直接给出最终答案，保持简洁。`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: `对话上下文：\n${conversationContext}\n\n当前任务：${taskInput}` },
  ];

  return chatCompletion(env, messages, agent.modelConfig);
}

/**
 * Trigger self-reflection and optional evolution for an agent after a task.
 * Runs asynchronously so it does not block the response stream.
 */
export function triggerSelfGrowth(
  env: Record<string, string | undefined>,
  agentId: string,
  taskInput: string,
  output: string,
  taskId?: string,
  conversationId?: string,
): void {
  // Fire-and-forget reflection + evolution
  void (async () => {
    try {
      const reflectionResult = await executeSkill(
        'skill_reflect',
        { agentId, taskInput, output, taskId, conversationId },
        env,
      ) as { reflection: { id: string; assessment: string } };

      const reflection = reflectionResult.reflection;
      if (reflection && reflection.assessment !== 'good') {
        await executeSkill('skill_evolve_agent', { agentId, reflectionId: reflection.id }, env);
      }
    } catch (e) {
      // Reflection failures should not break user experience
      console.error('[self-growth] failed:', e);
    }
  })();
}

/**
 * Super Agent self-improvement: analyze project code and create an improvement proposal.
 */
export async function createImprovementProposal(
  env: Record<string, string | undefined>,
  userRequest: string,
): Promise<ImprovementProposal> {
  const store = getStore(env);
  const superAgent = await getAgent('agent_super', env);

  // Scan project structure
  const project = await executeSkill('skill_list_project', {}, env) as { files: string[] };

  // Read a few key files to understand the architecture
  const keyFiles = ['edgeone.json', 'package.json', 'shared/types.ts', 'shared/orchestrator.ts'];
  const fileContents: { path: string; content: string }[] = [];
  for (const file of keyFiles) {
    if (project.files.includes(file)) {
      const result = await executeSkill('skill_read_code', { path: file }, env) as { content: string };
      fileContents.push({ path: file, content: result.content });
    }
  }

  const prompt = `你是系统架构师。请根据用户请求和当前项目代码，提出一个改进方案。\n\n用户请求：${userRequest}\n\n项目文件列表：\n${project.files.slice(0, 50).join('\n')}\n\n关键文件内容：\n${fileContents.map(f => `--- ${f.path} ---\n${f.content.slice(0, 2000)}`).join('\n\n')}\n\n请返回 JSON 格式：{"targetType": "agent|skill|code|system", "targetId": "可选", "description": "简短描述", "proposedChanges": "具体改动方案", "rationale": "理由"}`;

  const json = await chatCompletion(env, [
    { role: 'system', content: superAgent?.systemPrompt ?? 'You are a system architect.' },
    { role: 'user', content: prompt },
  ]);

  let parsed: Partial<ImprovementProposal> = {};
  try {
    parsed = JSON.parse(json.replace(/```json|```/g, '').trim());
  } catch {
    parsed = {
      targetType: 'system',
      description: '无法解析改进方案',
      proposedChanges: json,
      rationale: '由模型直接输出',
    };
  }

  const proposal: ImprovementProposal = {
    id: randomUUID(),
    targetType: parsed.targetType ?? 'system',
    targetId: parsed.targetId,
    description: parsed.description ?? userRequest,
    proposedChanges: parsed.proposedChanges ?? '无具体改动',
    rationale: parsed.rationale ?? '无说明',
    status: 'proposed',
    timestamp: Date.now(),
  };

  await store.saveProposal(proposal);
  return proposal;
}

/**
 * Super Agent creates a new specialist agent based on user description.
 */
export async function createAgentFromDescription(
  env: Record<string, string | undefined>,
  description: string,
  name?: string,
): Promise<AgentDefinition> {
  const result = await executeSkill('skill_create_agent', { description, name }, env) as { agent: AgentDefinition };
  return result.agent;
}

/**
 * Plan a complex task into subtasks and execute them.
 * MVP: only decomposes when explicitly requested or when the message contains multiple distinct tasks.
 */
export async function planAndExecute(
  env: Record<string, string | undefined>,
  input: OrchestratorInput,
): Promise<OrchestratorResult> {
  const store = getStore(env);
  const conversation = await store.getConversation(input.conversationId);
  const contextMessages = conversation?.messages ?? [];
  const contextText = contextMessages
    .slice(-10)
    .map(m => `${m.role}: ${m.content}`)
    .join('\n');

  // Handle explicit self-improvement / code improvement requests
  const lowerInput = input.message.toLowerCase();
  const isImprovementRequest =
    lowerInput.includes('改进') ||
    lowerInput.includes('优化') ||
    lowerInput.includes('完善') ||
    lowerInput.includes('重构') ||
    lowerInput.includes('self improve') ||
    lowerInput.includes('fix');

  if (isImprovementRequest && (lowerInput.includes('应用') || lowerInput.includes('系统') || lowerInput.includes('项目') || lowerInput.includes('代码'))) {
    const proposal = await createImprovementProposal(env, input.message);
    const response = `我已分析项目并生成改进方案（ID: ${proposal.id}）：\n\n**目标类型**：${proposal.targetType}\n**描述**：${proposal.description}\n**改动方案**：\n${proposal.proposedChanges}\n\n**理由**：${proposal.rationale}\n\n> 注：当前版本仅生成方案，实际代码修改需由开发者审核后应用。`;

    if (conversation) {
      conversation.messages.push({
        id: randomUUID(),
        conversationId: conversation.id,
        role: 'assistant',
        content: response,
        agentId: 'agent_super',
        timestamp: Date.now(),
      });
      conversation.updatedAt = Date.now();
      await store.saveConversation(conversation);
    }

    return {
      agentId: 'agent_super',
      agentName: '主智能体',
      taskId: randomUUID(),
      reasoning: '用户请求改进应用，主智能体扫描代码并生成改进方案',
      response,
    };
  }

  // Handle explicit agent creation requests
  const isCreateAgentRequest =
    lowerInput.includes('创建智能体') ||
    lowerInput.includes('新建智能体') ||
    lowerInput.includes('新智能体') ||
    lowerInput.includes('create agent') ||
    lowerInput.includes('add agent');

  if (isCreateAgentRequest) {
    const agent = await createAgentFromDescription(env, input.message);
    const response = `已创建新智能体 **${agent.name}**（${agent.role}）。\n\n- 描述：${agent.description}\n- 技能：${(await Promise.all(agent.skillIds.map(async id => (await store.getSkill(id))?.name ?? id))).join('、')}\n\n你可以在顶部下拉框中选择并使用它。`;

    if (conversation) {
      conversation.messages.push({
        id: randomUUID(),
        conversationId: conversation.id,
        role: 'assistant',
        content: response,
        agentId: 'agent_super',
        timestamp: Date.now(),
      });
      conversation.updatedAt = Date.now();
      await store.saveConversation(conversation);
    }

    return {
      agentId: 'agent_super',
      agentName: '主智能体',
      taskId: randomUUID(),
      reasoning: '用户请求创建新智能体',
      response,
    };
  }

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
  await store.saveTask(task);

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
  await store.saveTask(task);

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
    await store.saveConversation(conversation);
  }

  // Step 5: trigger self-growth asynchronously
  triggerSelfGrowth(env, agent.id, input.message, response, taskId, input.conversationId);

  return {
    agentId: agent.id,
    agentName: agent.name,
    taskId,
    reasoning,
    response,
  };
}
