import type {
  AgentDefinition,
  SkillDefinition,
  KnowledgeBase,
  Conversation,
  Task,
  Store,
} from './types';

/**
 * In-memory store implementation with a persistence-friendly interface.
 *
 * In production on EdgeOne Makers this can be swapped for Makers KV,
  SQLite (desktop), or another persistent store by implementing the Store interface.
 */
class MemoryStore implements Store {
  private agents = new Map<string, AgentDefinition>();
  private skills = new Map<string, SkillDefinition>();
  private knowledgeBases = new Map<string, KnowledgeBase>();
  private conversations = new Map<string, Conversation>();
  private tasks = new Map<string, Task>();

  constructor() {
    this.seedBuiltIns();
  }

  private seedBuiltIns() {
    const now = Date.now();

    // Built-in skills
    const skills: SkillDefinition[] = [
      {
        id: 'skill_file_operation',
        name: '文件操作',
        description: '读取、写入、搜索本地文件',
        version: '1.0.0',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['read', 'write', 'search'] },
            path: { type: 'string' },
            content: { type: 'string' },
          },
          required: ['action', 'path'],
        },
        outputSchema: { type: 'object', properties: { result: { type: 'string' } } },
        handler: 'fileOperation',
      },
      {
        id: 'skill_knowledge_retrieval',
        name: '知识库检索',
        description: '对本地向量化知识库进行语义检索',
        version: '1.0.0',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            knowledgeBaseId: { type: 'string' },
            topK: { type: 'number' },
          },
          required: ['query'],
        },
        outputSchema: { type: 'object', properties: { chunks: { type: 'array' } } },
        handler: 'knowledgeRetrieval',
      },
      {
        id: 'skill_code_execution',
        name: '代码执行',
        description: '在安全沙箱中执行代码',
        version: '1.0.0',
        inputSchema: {
          type: 'object',
          properties: {
            language: { type: 'string', enum: ['javascript', 'python'] },
            code: { type: 'string' },
          },
          required: ['language', 'code'],
        },
        outputSchema: { type: 'object', properties: { output: { type: 'string' }, error: { type: 'string' } } },
        handler: 'codeExecution',
      },
      {
        id: 'skill_web_search',
        name: '网页搜索',
        description: '搜索网页获取信息（需联网）',
        version: '1.0.0',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
          },
          required: ['query'],
        },
        outputSchema: { type: 'object', properties: { results: { type: 'array' } } },
        handler: 'webSearch',
      },
      {
        id: 'skill_calculator',
        name: '计算工具',
        description: '执行数学计算、单位换算等',
        version: '1.0.0',
        inputSchema: {
          type: 'object',
          properties: {
            expression: { type: 'string' },
          },
          required: ['expression'],
        },
        outputSchema: { type: 'object', properties: { result: { type: 'string' } } },
        handler: 'calculator',
      },
    ];

    for (const skill of skills) {
      this.skills.set(skill.id, skill);
    }

    // Built-in agents
    const agents: AgentDefinition[] = [
      {
        id: 'agent_super',
        name: '主智能体',
        avatar: '🎯',
        description: '统筹调度的超级智能体，负责理解意图、拆解任务、分配子智能体并整合结果',
        role: 'super',
        systemPrompt:
          '你是 AI 多智能体协作系统的主智能体（Super Agent）。你的职责是：\n' +
          '1. 理解用户意图与任务目标。\n' +
          '2. 将复杂任务拆解为可独立执行的子任务。\n' +
          '3. 根据子任务类型匹配最合适的专项智能体：代码任务交给代码智能体，写作任务交给写作智能体，研究分析交给研究智能体。\n' +
          '4. 汇总所有子任务结果，输出完整、连贯的最终答案。\n' +
          '5. 保持简洁，不要重复解释。',
        skillIds: ['skill_calculator', 'skill_knowledge_retrieval'],
        isBuiltIn: true,
      },
      {
        id: 'agent_coder',
        name: '代码智能体',
        avatar: '💻',
        description: '专注于编程开发任务，支持多语言代码生成、调试、审查、重构',
        role: 'coder',
        systemPrompt:
          '你是代码智能体。专注于编程与软件开发任务。\n' +
          '- 生成清晰、可运行、符合最佳实践的代码。\n' +
          '- 对代码进行审查时指出潜在问题与改进建议。\n' +
          '- 解释技术概念时简洁准确。\n' +
          '- 如果任务超出代码范畴，说明并拒绝。',
        skillIds: ['skill_code_execution', 'skill_file_operation'],
        isBuiltIn: true,
      },
      {
        id: 'agent_writer',
        name: '写作智能体',
        avatar: '✍️',
        description: '擅长各类文本创作，涵盖文章、报告、邮件、文案等多种文体',
        role: 'writer',
        systemPrompt:
          '你是写作智能体。擅长文本创作与润色。\n' +
          '- 根据需求生成结构清晰、风格合适的文本。\n' +
          '- 支持文章、报告、邮件、文案、翻译等多种文体。\n' +
          '- 可进行风格调整、润色优化。\n' +
          '- 保持语言自然流畅。',
        skillIds: ['skill_file_operation'],
        isBuiltIn: true,
      },
      {
        id: 'agent_researcher',
        name: '研究智能体',
        avatar: '🔍',
        description: '专攻信息检索与深度分析，可基于知识库进行主题研究、资料整理、报告撰写',
        role: 'researcher',
        systemPrompt:
          '你是研究智能体。擅长信息检索、资料整理与深度分析。\n' +
          '- 基于已有知识进行逻辑推理与综合分析。\n' +
          '- 整理资料时结构清晰、引用准确。\n' +
          '- 遇到不确定的信息明确说明。\n' +
          '- 可输出研究报告或摘要。',
        skillIds: ['skill_knowledge_retrieval', 'skill_web_search', 'skill_file_operation'],
        isBuiltIn: true,
      },
      {
        id: 'agent_reviewer',
        name: '审核智能体',
        avatar: '✅',
        description: '负责质量把控，对其他智能体的输出进行审核、纠错、评分',
        role: 'reviewer',
        systemPrompt:
          '你是审核智能体。负责对其他智能体的输出进行质量审核。\n' +
          '- 检查事实准确性、逻辑一致性、格式规范性。\n' +
          '- 指出问题并给出修改建议。\n' +
          '- 输出审核结论：通过/需修改，并说明理由。',
        skillIds: ['skill_calculator'],
        isBuiltIn: true,
      },
    ];

    for (const agent of agents) {
      this.agents.set(agent.id, agent);
    }

    // Seed a sample knowledge base
    this.knowledgeBases.set('kb_product_docs', {
      id: 'kb_product_docs',
      name: '产品文档库',
      description: '示例产品文档知识库',
      documents: [
        {
          id: 'doc_1',
          knowledgeBaseId: 'kb_product_docs',
          fileName: 'getting-started.md',
          content: 'AI 多智能体系统支持 1+N 协作模式，数据完全本地化，所有对话与知识库存储在用户设备。',
          status: 'indexed',
        },
      ],
    });

    // Seed sample conversation for demo
    const convId = 'conv_welcome';
    this.conversations.set(convId, {
      id: convId,
      title: '欢迎使用 AI 多智能体系统',
      messages: [
        {
          id: 'msg_1',
          conversationId: convId,
          role: 'assistant',
          content: '你好！我是主智能体，可以协调代码、写作、研究、审核等专项智能体为你服务。试着让我帮你写一段代码或分析一个主题。',
          agentId: 'agent_super',
          timestamp: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    });
  }

  // Agents
  listAgents(): AgentDefinition[] {
    return Array.from(this.agents.values());
  }

  getAgent(id: string): AgentDefinition | undefined {
    return this.agents.get(id);
  }

  saveAgent(agent: AgentDefinition): void {
    this.agents.set(agent.id, agent);
  }

  deleteAgent(id: string): void {
    this.agents.delete(id);
  }

  // Skills
  listSkills(): SkillDefinition[] {
    return Array.from(this.skills.values());
  }

  getSkill(id: string): SkillDefinition | undefined {
    return this.skills.get(id);
  }

  saveSkill(skill: SkillDefinition): void {
    this.skills.set(skill.id, skill);
  }

  deleteSkill(id: string): void {
    this.skills.delete(id);
  }

  // Knowledge bases
  listKnowledgeBases(): KnowledgeBase[] {
    return Array.from(this.knowledgeBases.values());
  }

  getKnowledgeBase(id: string): KnowledgeBase | undefined {
    return this.knowledgeBases.get(id);
  }

  // Conversations
  getConversation(id: string): Conversation | undefined {
    return this.conversations.get(id);
  }

  saveConversation(conversation: Conversation): void {
    this.conversations.set(conversation.id, conversation);
  }

  listConversations(userId?: string): Conversation[] {
    const all = Array.from(this.conversations.values());
    if (!userId) return all;
    return all.filter(c => c.userId === userId);
  }

  deleteConversation(id: string): void {
    this.conversations.delete(id);
  }

  // Tasks
  getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  saveTask(task: Task): void {
    this.tasks.set(task.id, task);
  }

  listTasks(conversationId?: string): Task[] {
    const all = Array.from(this.tasks.values());
    if (!conversationId) return all;
    return all.filter(t => {
      // Task does not store conversationId directly in type; keep simple for now.
      return true;
    });
  }
}

let globalStore: Store | undefined;

export function getStore(): Store {
  if (!globalStore) {
    globalStore = new MemoryStore();
  }
  return globalStore;
}

export function resetStore(): void {
  globalStore = undefined;
}
