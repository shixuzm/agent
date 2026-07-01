import { promises as fs } from 'fs';
import path from 'path';
import type { SkillDefinition, AgentDefinition } from './types';
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

    const kbs = kbId ? [store.getKnowledgeBase(kbId)].filter(Boolean) : store.listKnowledgeBases();
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
    const store = getStore();
    const agent = store.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const prompt = `你是 ${agent.name}。请对以下任务输出进行结构化反思。\n\n任务输入：${taskInput}\n\n你的输出：${output}\n\n请从以下维度评估：\n1. 是否准确理解了用户意图？\n2. 输出是否完整、有用、格式良好？\n3. 是否存在可以改进的地方？\n4. 下次类似任务可以如何做得更好？\n\n请只返回 JSON 格式：{"assessment": "good|adequate|poor", "strengths": [...], "weaknesses": [...], "improvements": [...], "suggestedPromptDelta": "可以追加到 systemPrompt 的简短经验", "suggestedSkillIds": [...]}`;

    const json = await chatCompletion(env ?? {}, [
      { role: 'system', content: agent.systemPrompt },
      { role: 'user', content: prompt },
    ]);

    let parsed: Partial<AgentReflection> = {};
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
      assessment: (parsed.assessment ?? 'adequate') as AgentReflection['assessment'],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      suggestedPromptDelta: parsed.suggestedPromptDelta,
      suggestedSkillIds: Array.isArray(parsed.suggestedSkillIds) ? parsed.suggestedSkillIds : [],
      timestamp: Date.now(),
    };

    store.saveReflection(reflection);
    return { reflection };
  },

  evolveAgent: async (params, env) => {
    const agentId = String(params.agentId ?? '');
    const reflectionId = String(params.reflectionId ?? '');
    const store = getStore();
    const agent = store.getAgent(agentId);
    const reflection = store.listReflections(agentId).find(r => r.id === reflectionId);

    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    if (!reflection) {
      throw new Error(`Reflection not found: ${reflectionId}`);
    }
    if (agent.isBuiltIn) {
      // Built-in agents are allowed to evolve, but we preserve original by creating a new generation
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
      const evolution: AgentEvolution = {
        id: randomUUID(),
        agentId,
        generation,
        previousPrompt: agent.systemPrompt,
        newPrompt,
        reason,
        triggeredByReflectionId: reflectionId,
        timestamp: Date.now(),
      };
      store.saveEvolution(evolution);

      const updated: AgentDefinition = {
        ...agent,
        systemPrompt: newPrompt,
        generation,
        updatedAt: Date.now(),
        skillIds: Array.from(new Set([
          ...agent.skillIds,
          ...(reflection.suggestedSkillIds ?? []).filter(id => store.getSkill(id)),
        ])),
      };
      store.saveAgent(updated);
      return { evolved: true, generation, reason };
    }

    return { evolved: false, generation: agent.generation ?? 0, reason };
  },

  createAgent: async (params, env) => {
    const description = String(params.description ?? '');
    const nameHint = String(params.name ?? '');
    const roleHint = String(params.roleHint ?? 'custom');
    const store = getStore();

    const availableSkills = store.listSkills().map(s => `${s.id}：${s.name}`).join('\n');

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
      skillIds: Array.isArray(parsed.skillIds) ? parsed.skillIds.filter(id => store.getSkill(id)) : ['skill_reflect', 'skill_evolve_agent'],
      isBuiltIn: false,
      generation: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    store.saveAgent(agent);
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
};

export function listSkills(): SkillDefinition[] {
  return getStore().listSkills();
}

export function getSkill(id: string): SkillDefinition | undefined {
  return getStore().getSkill(id);
}

export async function executeSkill(skillId: string, params: Record<string, unknown>, env?: Record<string, string | undefined>): Promise<unknown> {
  const skill = getSkill(skillId);
  if (!skill) {
    throw new Error(`Skill not found: ${skillId}`);
  }
  const handler = skill.handler ? skillHandlers[skill.handler] : undefined;
  if (!handler) {
    throw new Error(`Skill handler not implemented: ${skill.handler}`);
  }
  return handler(params, env);
}

export function getSkillDescriptionsForAgent(skillIds: string[]): string {
  return skillIds
    .map(id => {
      const skill = getSkill(id);
      return skill ? `- ${skill.name}：${skill.description}` : '';
    })
    .filter(Boolean)
    .join('\n');
}
