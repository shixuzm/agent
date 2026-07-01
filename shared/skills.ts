import { promises as fs } from 'fs';
import path from 'path';
import type { SkillDefinition, AgentDefinition, ScheduledTask } from './types';
import { SKILL_IDS } from './types';
import { getStore } from './store';
import { chatCompletion } from './llm';
import { randomUUID } from '../agents/_utils';

export type SkillHandler = (params: Record<string, unknown>, env?: Record<string, string | undefined>) => Promise<unknown>;

const skillHandlers: Record<string, SkillHandler> = {
  fileOperation: async (params) => {
    const action = String(params.action ?? '');
    const filePath = String(params.path ?? '');
    const content = params.content !== undefined ? String(params.content) : undefined;

    // In-memory demonstration: no real file system access in edge sandbox.
    if (action === 'read') {
      return { result: `[模拟读取] 文件 ${filePath} 的内容：\n这是示例文件内容。` };
    }
    if (action === 'write') {
      return { result: `[模拟写入] 已写入 ${filePath}，长度 ${content?.length ?? 0} 字符。` };
    }
    if (action === 'search') {
      return { result: `[模拟搜索] 在 ${filePath} 中未找到匹配项。` };
    }
    return { result: `[错误] 不支持的操作：${action}` };
  },

  knowledgeRetrieval: async (params) => {
    const query = String(params.query ?? '');
    const kbId = params.knowledgeBaseId ? String(params.knowledgeBaseId) : undefined;
    const store = getStore();

    const kbs = kbId ? [(await store.getKnowledgeBase(kbId))] : (await store.listKnowledgeBases());
    const chunks: { documentId: string; fileName: string; snippet: string; score: number }[] = [];

    for (const kb of kbs) {
      if (!kb) continue;
      for (const doc of kb.documents) {
        if (doc.status === 'indexed' && doc.content.includes(query)) {
          chunks.push({
            documentId: doc.id,
            fileName: doc.fileName,
            snippet: doc.content.slice(0, 200),
            score: 0.9,
          });
        }
      }
    }

    return { chunks: chunks.slice(0, Number(params.topK ?? 3)) };
  },

  codeExecution: async (params) => {
    const language = String(params.language ?? '');
    const code = String(params.code ?? '');

    // Demonstration only: do not eval untrusted code in production.
    if (language === 'javascript') {
      try {
        // eslint-disable-next-line no-new-func
        const fn = new Function(`"use strict"; ${code}`);
        const result = fn();
        return { output: String(result ?? 'undefined') };
      } catch (e) {
        return { output: '', error: e instanceof Error ? e.message : String(e) };
      }
    }

    return { output: '', error: `[模拟执行] ${language} 代码执行在当前环境不可用。` };
  },

  webSearch: async (params) => {
    const query = String(params.query ?? '');
    return {
      results: [
        { title: `[模拟结果] 关于 "${query}" 的搜索结果`, url: '#', snippet: '这是模拟搜索结果，实际部署时可接入搜索引擎 API。' },
      ],
    };
  },

  calculator: async (params) => {
    const expression = String(params.expression ?? '');
    try {
      // eslint-disable-next-line no-new-func
      const result = new Function(`return (${expression})`)();
      return { result: String(result) };
    } catch (e) {
      return { result: '', error: e instanceof Error ? e.message : String(e) };
    }
  },

  // Meta-cognition & self-improvement handlers
  selfReflect: async (params, env) => {
    const agentId = String(params.agentId ?? '');
    const taskInput = String(params.taskInput ?? '');
    const output = String(params.output ?? '');
    const store = getStore(env);
    const agent = await store.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const prompt = `你是 ${agent.name}。请对以下任务输出进行结构化反思。\n\n任务输入：${taskInput}\n\n你的输出：${output}\n\n请从以下维度评估：\n1. 是否准确理解了用户意图？\n2. 输出是否完整、有用、格式良好？\n3. 是否存在可以改进的地方？\n4. 下次类似任务可以如何做得更好？\n\n请只返回 JSON 格式：{"assessment": "good|adequate|poor", "strengths": [...], "weaknesses": [...], "improvements": [...], "suggestedPromptDelta": "可以追加到 systemPrompt 的简短经验", "suggestedSkillIds": [...]}`;

    const json = await chatCompletion(env ?? {}, [
      { role: 'system', content: agent.systemPrompt },
      { role: 'user', content: prompt },
    ]);

    let parsed: Partial<import('./types').AgentReflection> = {};
    try {
      parsed = JSON.parse(json.replace(/```json|```/g, '').trim());
    } catch {
      parsed = { assessment: 'adequate', strengths: [], weaknesses: ['无法解析反思结果'], improvements: [] };
    }

    const reflection = {
      id: randomUUID(),
      agentId,
      taskInput,
      originalOutput: output,
      assessment: (parsed.assessment ?? 'adequate') as import('./types').AgentReflection['assessment'],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      suggestedPromptDelta: parsed.suggestedPromptDelta,
      suggestedSkillIds: Array.isArray(parsed.suggestedSkillIds) ? parsed.suggestedSkillIds : [],
      timestamp: Date.now(),
    };

    await store.saveReflection(reflection);
    return { reflection };
  },

  evolveAgent: async (params, env) => {
    const agentId = String(params.agentId ?? '');
    const reflectionId = String(params.reflectionId ?? '');
    const store = getStore(env);
    const agent = await store.getAgent(agentId);
    const reflection = (await store.listReflections(agentId)).find(r => r.id === reflectionId);

    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    if (!reflection) {
      throw new Error(`Reflection not found: ${reflectionId}`);
    }

    const prompt = `你是智能体进化专家。请根据以下反思结果，优化 ${agent.name} 的 systemPrompt。\n\n当前 systemPrompt：\n"""${agent.systemPrompt}"""\n\n反思：\n- 优点：${reflection.strengths.join('；')}\n- 不足：${reflection.weaknesses.join('；')}\n- 改进建议：${reflection.improvements.join('；')}\n- 建议追加到 systemPrompt 的经验：${reflection.suggestedPromptDelta ?? '无'}\n\n请生成优化后的完整 systemPrompt，并说明修改理由。只返回 JSON 格式：{"newPrompt": "", "reason": ""}`;

    const json = await chatCompletion(env ?? {}, [
      { role: 'system', content: 'You are an expert prompt engineer.' },
      { role: 'user', content: prompt },
    ]);

    let newPrompt = agent.systemPrompt;
    let reason = 'No evolution applied';
    try {
      const parsed = JSON.parse(json.replace(/```json|```/g, '').trim());
      newPrompt = parsed.newPrompt ?? newPrompt;
      reason = parsed.reason ?? reason;
    } catch {
      // keep original
    }

    // Only evolve if prompt actually changed
    if (newPrompt !== agent.systemPrompt) {
      const generation = (agent.generation ?? 0) + 1;
      const evolution: import('./types').AgentEvolution = {
        id: randomUUID(),
        agentId,
        generation,
        previousPrompt: agent.systemPrompt,
        newPrompt,
        reason,
        triggeredByReflectionId: reflectionId,
        timestamp: Date.now(),
      };
      await store.saveEvolution(evolution);

      const validSuggestedSkills = await Promise.all(
        (reflection.suggestedSkillIds ?? []).map(async id => ((await store.getSkill(id)) ? id : null))
      );
      const updated: AgentDefinition = {
        ...agent,
        systemPrompt: newPrompt,
        generation,
        updatedAt: Date.now(),
        skillIds: Array.from(new Set([
          ...agent.skillIds,
          ...(validSuggestedSkills.filter(Boolean) as string[]),
        ])),
      };
      await store.saveAgent(updated);
      return { evolved: true, generation, reason };
    }

    return { evolved: false, generation: agent.generation ?? 0, reason };
  },

  createAgent: async (params, env) => {
    const description = String(params.description ?? '');
    const nameHint = String(params.name ?? '');
    const store = getStore(env);

    const availableSkills = (await store.listSkills()).map(s => `${s.id}：${s.name}`).join('\n');

    const prompt = `你是一个智能体设计专家。请根据以下描述设计一个新的专项智能体。\n\n描述：${description}\n\n可选技能：\n${availableSkills}\n\n请返回 JSON 格式：\n{\n  "id": "agent_xxx",\n  "name": "智能体名称",\n  "avatar": "emoji",\n  "description": "简短描述",\n  "role": "custom",\n  "systemPrompt": "详细的 systemPrompt",\n  "skillIds": ["skill_id_1", "skill_id_2"]\n}`;

    const json = await chatCompletion(env ?? {}, [
      { role: 'system', content: 'You are an agent designer for an AI multi-agent system.' },
      { role: 'user', content: prompt },
    ]);

    let parsed: Partial<AgentDefinition> = {};
    try {
      parsed = JSON.parse(json.replace(/```json|```/g, '').trim());
    } catch {
      throw new Error('Failed to parse generated agent definition');
    }

    const agent: AgentDefinition = {
      id: parsed.id ?? `agent_${Date.now()}`,
      name: nameHint || parsed.name || '新智能体',
      avatar: parsed.avatar || '🤖',
      description: parsed.description ?? description,
      role: (parsed.role as AgentDefinition['role']) ?? 'custom',
      systemPrompt: parsed.systemPrompt ?? `你是 ${nameHint || parsed.name || '新智能体'}，${description}`,
      skillIds: Array.isArray(parsed.skillIds)
        ? (await Promise.all(parsed.skillIds.map(async id => ((await store.getSkill(id)) ? id : null)))).filter(Boolean) as string[]
        : ['skill_reflect', 'skill_evolve_agent'],
      isBuiltIn: false,
      generation: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await store.saveAgent(agent);
    return { agent };
  },

  readCode: async (params) => {
    const filePath = String(params.path ?? '');
    const safePath = path.resolve('/workspace', filePath).replace(/\.\./g, '');
    // Only allow reading project files under /workspace
    if (!safePath.startsWith('/workspace')) {
      return { content: '', error: 'Access denied: path must be within project directory' };
    }
    try {
      const content = await fs.readFile(safePath, 'utf-8');
      return { content };
    } catch (e) {
      return { content: '', error: e instanceof Error ? e.message : String(e) };
    }
  },

  listProject: async () => {
    const root = '/workspace';
    const files: string[] = [];

    async function walk(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relative = path.relative(root, fullPath);
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (/\.(ts|tsx|js|jsx|json|md|css)$/.test(entry.name)) {
          files.push(relative);
        }
      }
    }

    try {
      await walk(root);
    } catch {
      // ignore
    }

    return { files: files.sort() };
  },

  // Task 3-7: dialogue assistant, file handler, content generator, workflow orchestrator, scheduler
  dialogueAssistant: async (params, env) => {
    const action = String(params.action ?? '');
    const messages = Array.isArray(params.messages)
      ? params.messages.map(m =>
          typeof m === 'object' && m !== null
            ? { role: String((m as { role?: unknown }).role ?? ''), content: String((m as { content?: unknown }).content ?? '') }
            : { role: '', content: '' }
        )
      : [];
    const query = String(params.query ?? '');

    if (!['summarize', 'extract', 'reply'].includes(action)) {
      return { error: `Unsupported action: ${action}` };
    }

    const context = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    let userPrompt = '';
    if (action === 'summarize') {
      userPrompt = `请对以下对话进行摘要，提炼核心要点与结论：\n\n${context}`;
    } else if (action === 'extract') {
      userPrompt = `请从以下对话中提取关键信息，包括 action items、关键决策、待办事项与责任人：\n\n${context}`;
    } else {
      userPrompt = `基于以下对话上下文，回答用户问题：${query}\n\n${context}`;
    }

    const result = await chatCompletion(env ?? {}, [
      { role: 'system', content: '你是一位对话分析助手，擅长摘要、信息提取与上下文回复。' },
      { role: 'user', content: userPrompt },
    ]);

    return { action, result };
  },

  fileHandler: async (params) => {
    const action = String(params.action ?? '');
    const relPath = String(params.path ?? '');
    const content = params.content !== undefined ? String(params.content) : undefined;

    const root = '/workspace';
    const resolved = path.resolve(root, relPath);
    const normalized = path.normalize(resolved);
    if (!normalized.startsWith(root + path.sep) && normalized !== root) {
      return { error: 'Access denied: path must be within /workspace' };
    }

    if (action === 'read') {
      try {
        const data = await fs.readFile(normalized, 'utf-8');
        return { content: data };
      } catch (e) {
        return { content: '', error: e instanceof Error ? e.message : String(e) };
      }
    }

    if (action === 'write') {
      if (content === undefined) {
        return { error: 'Missing content for write action' };
      }
      try {
        await fs.mkdir(path.dirname(normalized), { recursive: true });
        await fs.writeFile(normalized, content, 'utf-8');
        return { written: true, path: normalized, length: content.length };
      } catch (e) {
        return { written: false, error: e instanceof Error ? e.message : String(e) };
      }
    }

    if (action === 'list') {
      try {
        const entries = await fs.readdir(normalized, { withFileTypes: true });
        return {
          files: entries.map(entry => ({
            name: entry.name,
            isDirectory: entry.isDirectory(),
          })),
        };
      } catch (e) {
        return { files: [], error: e instanceof Error ? e.message : String(e) };
      }
    }

    return { error: `Unsupported action: ${action}` };
  },

  contentGenerator: async (params, env) => {
    const type = String(params.type ?? 'text');
    const prompt = String(params.prompt ?? '');
    const language = String(params.language ?? '');
    const format = String(params.format ?? '');

    let systemPrompt = '你是一位内容生成助手。';
    let userPrompt = prompt;

    if (type === 'code') {
      systemPrompt = `你是一位代码生成助手。生成${language ? ` ${language}` : ''}代码，只输出可执行代码，避免冗长解释。`;
      userPrompt = `请生成以下需求的代码：\n${prompt}`;
    } else if (type === 'doc') {
      systemPrompt = '你是一位文档撰写助手，生成结构清晰、内容完整的文档。';
      userPrompt = `请根据以下需求生成文档${format ? `（格式：${format}）` : ''}：\n${prompt}`;
    } else {
      userPrompt = `请根据以下需求生成文本内容：\n${prompt}`;
    }

    const result = await chatCompletion(env ?? {}, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    return { type, content: result };
  },

  workflowOrchestrator: async (params, env) => {
    const action = String(params.action ?? '');

    if (action === 'createPlan') {
      const goal = String(params.goal ?? '');
      const availableSkills = (await listSkills(env)).map(s => `${s.id}：${s.name}`).join('\n');
      const userPrompt = `你是一个工作流规划助手。请根据目标制定执行计划。\n\n目标：${goal}\n\n可用技能：\n${availableSkills}\n\n请返回 JSON 数组，每个元素包含 { id, description, skillId, params, dependsOn }。dependsOn 是前置步骤 id 数组。只返回 JSON，不要额外说明。`;

      const raw = await chatCompletion(env ?? {}, [
        { role: 'system', content: '你是一个工作流规划专家，只返回合法的 JSON。' },
        { role: 'user', content: userPrompt },
      ]);

      try {
        const steps = JSON.parse(raw.replace(/```json|```/g, '').trim());
        return { steps };
      } catch {
        return { steps: [], raw, error: 'Failed to parse plan JSON' };
      }
    }

    if (action === 'executeStep') {
      const stepParam = params.step as Record<string, unknown> | undefined;
      let step: Record<string, unknown> | undefined = stepParam;

      if (!step && params.stepId) {
        const stepId = String(params.stepId);
        const steps = Array.isArray(params.steps) ? params.steps : [];
        step = steps.find(
          (s: unknown) => typeof s === 'object' && s !== null && (s as { id?: string }).id === stepId
        ) as Record<string, unknown> | undefined;
      }

      if (!step || typeof step !== 'object') {
        return { error: 'Missing step to execute. Provide step object or stepId + steps.' };
      }

      const skillId = String(step.skillId ?? '');
      const skillParams = typeof step.params === 'object' && step.params !== null
        ? (step.params as Record<string, unknown>)
        : {};
      const result = await executeSkill(skillId, skillParams, env);
      return { stepId: step.id, result };
    }

    return { error: `Unsupported action: ${action}` };
  },

  scheduler: async (params, env) => {
    const action = String(params.action ?? '');
    const store = getStore(env);

    if (action === 'create') {
      const taskParam = params.task as Partial<ScheduledTask> | undefined;
      if (!taskParam || typeof taskParam !== 'object') {
        return { error: 'Missing task to create' };
      }
      if (!taskParam.skillId) {
        return {
          error: `skillId is required. Built-in skill IDs include: ${Object.values(SKILL_IDS).join(', ')}`,
        };
      }

      const now = Date.now();
      const task: ScheduledTask = {
        id: taskParam.id || `scheduled_${now}_${Math.random().toString(36).slice(2, 8)}`,
        name: taskParam.name || '未命名任务',
        description: taskParam.description,
        cron: taskParam.cron || '0 9 * * *',
        skillId: taskParam.skillId,
        params: taskParam.params,
        enabled: taskParam.enabled !== false,
        createdAt: taskParam.createdAt || now,
        updatedAt: now,
      };

      await store.saveScheduledTask(task);
      return { task };
    }

    if (action === 'list') {
      const tasks = await store.listScheduledTasks();
      return { tasks };
    }

    if (action === 'delete') {
      const taskId = String(params.taskId ?? '');
      await store.deleteScheduledTask(taskId);
      return { deleted: true, taskId };
    }

    if (action === 'toggle') {
      const taskId = String(params.taskId ?? '');
      const task = await store.getScheduledTask(taskId);
      if (!task) {
        return { error: `Task not found: ${taskId}` };
      }
      const updated: ScheduledTask = { ...task, enabled: !task.enabled, updatedAt: Date.now() };
      await store.saveScheduledTask(updated);
      return { task: updated, enabled: updated.enabled };
    }

    return { error: `Unsupported action: ${action}` };
  },
};

export async function listSkills(env?: Record<string, unknown>): Promise<SkillDefinition[]> {
  return getStore(env).listSkills();
}

export async function getSkill(id: string, env?: Record<string, unknown>): Promise<SkillDefinition | undefined> {
  return getStore(env).getSkill(id);
}

export async function executeSkill(skillId: string, params: Record<string, unknown>, env?: Record<string, string | undefined>): Promise<unknown> {
  const skill = await getSkill(skillId, env);
  if (!skill) {
    throw new Error(`Skill not found: ${skillId}`);
  }
  const handler = skill.handler ? skillHandlers[skill.handler] : undefined;
  if (!handler) {
    throw new Error(`Skill handler not implemented: ${skill.handler}`);
  }
  return handler(params, env);
}

export async function getSkillDescriptionsForAgent(skillIds: string[], env?: Record<string, unknown>): Promise<string> {
  const descriptions = await Promise.all(
    skillIds.map(async id => {
      const skill = await getSkill(id, env);
      return skill ? `- ${skill.name}：${skill.description}` : '';
    })
  );
  return descriptions.filter(Boolean).join('\n');
}
