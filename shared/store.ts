import type {
  AgentDefinition,
  SkillDefinition,
  KnowledgeBase,
  Conversation,
  Task,
  AgentReflection,
  AgentEvolution,
  ImprovementProposal,
  Store,
} from './types';
import { KVStore } from './kvStore';

/**
 * In-memory store implementation with a persistence-friendly interface.
 *
 * In production on EdgeOne Makers this can be swapped for Makers KV,
 * SQLite (desktop), or another persistent store by implementing the Store interface.
 */
class MemoryStore implements Store {
  private agents = new Map<string, AgentDefinition>();
  private skills = new Map<string, SkillDefinition>();
  private knowledgeBases = new Map<string, KnowledgeBase>();
  private conversations = new Map<string, Conversation>();
  private tasks = new Map<string, Task>();
  private reflections = new Map<string, AgentReflection>();
  private evolutions = new Map<string, AgentEvolution>();
  private proposals = new Map<string, ImprovementProposal>();

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
      // Meta-cognition & self-improvement skills
      {
        id: 'skill_reflect',
        name: '自我反思',
        description: '对本次任务输出进行反思，总结优点、不足与改进方向',
        version: '1.0.0',
        inputSchema: {
          type: 'object',
          properties: {
            agentId: { type: 'string' },
            taskInput: { type: 'string' },
            output: { type: 'string' },
          },
          required: ['agentId', 'taskInput', 'output'],
        },
        outputSchema: { type: 'object', properties: { reflection: { type: 'object' } } },
        handler: 'selfReflect',
      },
      {
        id: 'skill_evolve_agent',
        name: '智能体进化',
        description: '根据反思结果优化智能体的 systemPrompt 或技能组合',
        version: '1.0.0',
        inputSchema: {
          type: 'object',
          properties: {
            agentId: { type: 'string' },
            reflectionId: { type: 'string' },
          },
          required: ['agentId', 'reflectionId'],
        },
        outputSchema: { type: 'object', properties: { evolved: { type: 'boolean' } } },
        handler: 'evolveAgent',
      },
      {
        id: 'skill_create_agent',
        name: '创建智能体',
        description: '根据自然语言描述创建新的专项智能体',
        version: '1.0.0',
        inputSchema: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            name: { type: 'string' },
            roleHint: { type: 'string' },
          },
          required: ['description'],
        },
        outputSchema: { type: 'object', properties: { agent: { type: 'object' } } },
        handler: 'createAgent',
      },
      {
        id: 'skill_read_code',
        name: '代码阅读',
        description: '读取项目源代码文件，用于自我完善与分析',
        version: '1.0.0',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string' },
          },
          required: ['path'],
        },
        outputSchema: { type: 'object', properties: { content: { type: 'string' } } },
        handler: 'readCode',
      },
      {
        id: 'skill_list_project',
        name: '项目结构扫描',
        description: '扫描项目文件结构，列出关键源码文件',
        version: '1.0.0',
        inputSchema: { type: 'object', properties: {} },
        outputSchema: { type: 'object', properties: { files: { type: 'array' } } },
        handler: 'listProject',
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
        description: '统筹调度的超级智能体，负责理解意图、拆解任务、分配子智能体并整合结果。具备自我反思、自我完善和创建新智能体的能力。',
        role: 'super',
        systemPrompt:
          '你是 AI 多智能体协作系统的主智能体（Super Agent）。你的职责是：\n' +
          '1. 理解用户意图与任务目标。\n' +
          '2. 将复杂任务拆解为可独立执行的子任务。\n' +
          '3. 根据子任务类型匹配最合适的专项智能体：代码任务交给代码智能体，写作任务交给写作智能体，研究分析交给研究智能体。\n' +
          '4. 汇总所有子任务结果，输出完整、连贯的最终答案。\n' +
          '5. 保持简洁，不要重复解释。\n' +
          '\n' +
          '自我完善与成长能力：\n' +
          '- 当用户要求改进本应用、优化系统或修复问题时，你可以使用代码阅读和项目结构扫描技能分析当前代码库。\n' +
          '- 你可以提出改进方案（Improvement Proposal），描述要修改什么以及为什么。\n' +
          '- 当现有智能体无法很好处理某类任务时，你可以使用「创建智能体」技能动态创建新的专项智能体。\n' +
          '- 每次任务完成后，你会进行自我反思，持续优化调度策略。\n' +
          '\n' +
          '创建新智能体规则：\n' +
          '- 只在明确需要新类型智能体时创建。\n' +
          '- 为新智能体分配清晰的 role、systemPrompt 和 skillIds。\n' +
          '- 创建后告诉用户新智能体的名称和能力。',
        skillIds: [
          'skill_calculator',
          'skill_knowledge_retrieval',
          'skill_reflect',
          'skill_evolve_agent',
          'skill_create_agent',
          'skill_read_code',
          'skill_list_project',
        ],
        isBuiltIn: true,
        generation: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'agent_coder',
        name: '代码智能体',
        avatar: '💻',
        description: '专注于编程开发任务，支持多语言代码生成、调试、审查、重构。具备自我反思与进化能力。',
        role: 'coder',
        systemPrompt:
          '你是代码智能体。专注于编程与软件开发任务。\n' +
          '- 生成清晰、可运行、符合最佳实践的代码。\n' +
          '- 对代码进行审查时指出潜在问题与改进建议。\n' +
          '- 解释技术概念时简洁准确。\n' +
          '- 如果任务超出代码范畴，说明并拒绝。\n' +
          '\n' +
          '自我成长：每次任务结束后，你会反思输出质量，识别可以改进的地方，并在后续任务中应用这些经验。',
        skillIds: ['skill_code_execution', 'skill_file_operation', 'skill_reflect', 'skill_evolve_agent', 'skill_read_code'],
        isBuiltIn: true,
        generation: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'agent_writer',
        name: '写作智能体',
        avatar: '✍️',
        description: '擅长各类文本创作，涵盖文章、报告、邮件、文案等多种文体。具备自我反思与进化能力。',
        role: 'writer',
        systemPrompt:
          '你是写作智能体。擅长文本创作与润色。\n' +
          '- 根据需求生成结构清晰、风格合适的文本。\n' +
          '- 支持文章、报告、邮件、文案、翻译等多种文体。\n' +
          '- 可进行风格调整、润色优化。\n' +
          '- 保持语言自然流畅。\n' +
          '\n' +
          '自我成长：每次任务结束后，你会反思输出质量，识别可以改进的地方，并在后续任务中应用这些经验。',
        skillIds: ['skill_file_operation', 'skill_reflect', 'skill_evolve_agent'],
        isBuiltIn: true,
        generation: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'agent_researcher',
        name: '研究智能体',
        avatar: '🔍',
        description: '专攻信息检索与深度分析，可基于知识库进行主题研究、资料整理、报告撰写。具备自我反思与进化能力。',
        role: 'researcher',
        systemPrompt:
          '你是研究智能体。擅长信息检索、资料整理与深度分析。\n' +
          '- 基于已有知识进行逻辑推理与综合分析。\n' +
          '- 整理资料时结构清晰、引用准确。\n' +
          '- 遇到不确定的信息明确说明。\n' +
          '- 可输出研究报告或摘要。\n' +
          '\n' +
          '自我成长：每次任务结束后，你会反思输出质量，识别可以改进的地方，并在后续任务中应用这些经验。',
        skillIds: ['skill_knowledge_retrieval', 'skill_web_search', 'skill_file_operation', 'skill_reflect', 'skill_evolve_agent'],
        isBuiltIn: true,
        generation: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'agent_reviewer',
        name: '审核智能体',
        avatar: '✅',
        description: '负责质量把控，对其他智能体的输出进行审核、纠错、评分。具备自我反思与进化能力。',
        role: 'reviewer',
        systemPrompt:
          '你是审核智能体。负责对其他智能体的输出进行质量审核。\n' +
          '- 检查事实准确性、逻辑一致性、格式规范性。\n' +
          '- 指出问题并给出修改建议。\n' +
          '- 输出审核结论：通过/需修改，并说明理由。\n' +
          '\n' +
          '自我成长：每次任务结束后，你会反思审核判断，识别可以改进的地方，并在后续任务中应用这些经验。',
        skillIds: ['skill_calculator', 'skill_reflect', 'skill_evolve_agent'],
        isBuiltIn: true,
        generation: 0,
        createdAt: now,
        updatedAt: now,
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
          content: 'AI 多智能体系统支持 1+N 协作模式，数据完全本地化，所有对话与知识库存储在用户设备。系统支持智能体自我反思、自我成长和动态创建新智能体。',
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
          content: '你好！我是主智能体，可以协调代码、写作、研究、审核等专项智能体为你服务。我支持自我反思、自我完善，也可以在需要时创建新的智能体。试着让我帮你写一段代码或分析一个主题。',
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

  // Reflections
  saveReflection(reflection: AgentReflection): void {
    this.reflections.set(reflection.id, reflection);
  }

  listReflections(agentId?: string): AgentReflection[] {
    const all = Array.from(this.reflections.values());
    if (!agentId) return all;
    return all.filter(r => r.agentId === agentId);
  }

  // Evolutions
  saveEvolution(evolution: AgentEvolution): void {
    this.evolutions.set(evolution.id, evolution);
  }

  listEvolutions(agentId?: string): AgentEvolution[] {
    const all = Array.from(this.evolutions.values());
    if (!agentId) return all;
    return all.filter(e => e.agentId === agentId);
  }

  // Improvement proposals
  saveProposal(proposal: ImprovementProposal): void {
    this.proposals.set(proposal.id, proposal);
  }

  getProposal(id: string): ImprovementProposal | undefined {
    return this.proposals.get(id);
  }

  listProposals(status?: ImprovementProposal['status']): ImprovementProposal[] {
    const all = Array.from(this.proposals.values());
    if (!status) return all;
    return all.filter(p => p.status === status);
  }
}

let globalStore: Store | undefined;

export function getStore(env?: Record<string, unknown>): Store {
  if (!globalStore) {
    globalStore = env ? new KVStore(env) : new MemoryStore();
  }
  return globalStore;
}

export function resetStore(): void {
  globalStore = undefined;
}
