import type { SkillDefinition } from './types';
import { getStore } from './store';

export type SkillHandler = (params: Record<string, unknown>) => Promise<unknown>;

const skillHandlers: Record<string, SkillHandler> = {
  fileOperation: async (params) => {
    const action = String(params.action ?? '');
    const path = String(params.path ?? '');
    const content = params.content !== undefined ? String(params.content) : undefined;

    // In-memory demonstration: no real file system access in edge sandbox.
    if (action === 'read') {
      return { result: `[模拟读取] 文件 ${path} 的内容：\n这是示例文件内容。` };
    }
    if (action === 'write') {
      return { result: `[模拟写入] 已写入 ${path}，长度 ${content?.length ?? 0} 字符。` };
    }
    if (action === 'search') {
      return { result: `[模拟搜索] 在 ${path} 中未找到匹配项。` };
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
};

export function listSkills(): SkillDefinition[] {
  return getStore().listSkills();
}

export function getSkill(id: string): SkillDefinition | undefined {
  return getStore().getSkill(id);
}

export async function executeSkill(skillId: string, params: Record<string, unknown>): Promise<unknown> {
  const skill = getSkill(skillId);
  if (!skill) {
    throw new Error(`Skill not found: ${skillId}`);
  }
  const handler = skill.handler ? skillHandlers[skill.handler] : undefined;
  if (!handler) {
    throw new Error(`Skill handler not implemented: ${skill.handler}`);
  }
  return handler(params);
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
