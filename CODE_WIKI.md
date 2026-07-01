# AI · Code Wiki

> 本文档基于仓库中的 [AI-项目计划书.md](file:///workspace/AI-项目计划书.md) 整理，描述项目的规划架构、模块职责、技术栈、数据模型与运行方式。
> **说明：** 当前仓库处于项目规划阶段，尚未包含实际源码，因此“关键类与函数说明”一节以规划中的核心抽象与接口形式呈现，待代码实现后应补充具体文件路径、类名与函数签名。

---

## 1. 项目概述

### 1.1 项目定位

**AI** 是一款纯本地离线运行的多智能体协作系统，采用 **“1 个主智能体 + N 个专项子智能体”** 的协作模式。用户无需登录、无需云端，即可在本地设备上构建智能协作网络，完成复杂任务的自动拆解、并行执行与结果整合。

### 1.2 核心价值

| 价值点 | 说明 |
|--------|------|
| 数据完全本地化 | 对话、配置、知识库均存储在本地 SQLite，默认 AES 加密 |
| 多智能体并行 | 主智能体拆解任务，子智能体并行执行，效率优于单智能体串行 |
| 模块化可扩展 | 智能体、技能、知识库三大模块解耦，可按需组合 |
| 开箱即用 | 支持打包为 EXE、APK、IPA 等格式，下载即用 |

### 1.3 关键指标

| 指标 | 目标值 |
|------|--------|
| 架构模式 | 1 + N（主智能体 + N 个子智能体） |
| 部署方式 | 100% 本地离线 |
| 支持平台 | Windows / macOS / Linux / iOS / Android / Web |
| 可扩展技能 | 无限扩展 |

---

## 2. 整体架构

### 2.1 分层架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        表现层 (Presentation)                 │
│   桌面端 Electron  │  移动端 Capacitor  │  Web 端 SPA        │
└──────────┬───────────────────┬───────────────────┬──────────┘
           │                   │                   │
┌──────────▼───────────────────▼───────────────────▼──────────┐
│                        应用层 (Application)                  │
│  对话交互  │ 智能体管理 │ 技能管理 │ 知识库 │ API 管理 │ 任务编排 │
└──────────┬──────────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────┐
│                        核心层 (Core)                         │
│  主智能体调度器  │  子智能体池  │  技能执行引擎              │
│  上下文管理器    │  消息总线                                 │
└──────────┬──────────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────┐
│                        数据层 (Data)                         │
│  SQLite 本地数据库  │  向量数据库  │  文件存储              │
└──────────┬──────────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────┐
│                        接入层 (Adapter)                      │
│  本地大模型接口  │  云端 API 统一接口  │  第三方服务接口     │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 各层职责

| 层级 | 主要职责 |
|------|----------|
| 表现层 | 负责用户界面渲染与交互，桌面端基于 Electron，移动端基于 Capacitor，Web 端为 SPA |
| 应用层 | 面向用户的业务功能模块，包括对话、智能体管理、技能管理、知识库、API 管理、任务编排 |
| 核心层 | 系统运转的核心引擎，负责任务调度、智能体协作、技能执行、上下文管理与智能体间通信 |
| 数据层 | 负责所有本地数据的持久化，包括结构化数据、向量数据、文件与配置 |
| 接入层 | 统一封装大模型调用能力，支持本地模型与多种云端 API（OpenAI、Anthropic 等） |

---

## 3. 技术栈

### 3.1 各层技术选型

| 层级 | 技术选型 | 选型理由 |
|------|----------|----------|
| 前端框架 | Vue 3 + TypeScript | 生态成熟、响应式系统适合复杂交互、TypeScript 友好 |
| 桌面端 | Electron | 跨平台、Node.js 原生能力、打包工具链完善 |
| 移动端 | Capacitor | Web 技术复用、支持 iOS/Android 原生能力调用 |
| 后端/逻辑层 | Node.js + TypeScript | 前后端语言统一、异步并发能力强、包生态丰富 |
| 本地数据库 | SQLite (better-sqlite3) | 零配置、单文件、事务支持、嵌入式部署 |
| 向量检索 | SQLite-vss / 本地向量库 | 与主数据库统一、纯本地、无需额外服务 |
| 状态管理 | Pinia | Vue 3 官方推荐、TypeScript 友好、DevTools 支持 |
| UI 组件库 | Element Plus + 自定义组件 | 组件丰富、主题可定制、适配深色模式 |
| 打包构建 | Vite + electron-builder | 构建速度快、热更新、多平台打包配置简单 |

### 3.2 运行时依赖（规划）

| 类别 | 关键依赖 | 用途 |
|------|----------|------|
| 框架运行时 | `vue`, `pinia`, `vue-router` | 前端框架、状态管理、路由 |
| 桌面端 | `electron`, `electron-builder` | 桌面应用壳与打包 |
| 移动端 | `@capacitor/core`, `@capacitor/ios`, `@capacitor/android` | 移动端适配 |
| 本地数据库 | `better-sqlite3`, `sqlite-vss` | SQLite 访问与向量扩展 |
| 构建工具 | `vite`, `typescript`, `eslint`, `prettier` | 构建、类型检查、代码规范 |
| 大模型接入 | 兼容 OpenAI 标准的 HTTP 客户端 | 调用本地/云端大模型 API |

---

## 4. 模块职责

### 4.1 表现层模块

| 模块 | 职责 | 规划技术 |
|------|------|----------|
| 桌面端壳 | 提供窗口管理、系统托盘、菜单、本地文件访问能力 | Electron Main Process |
| Web 端 SPA | 提供完整的 Web 交互界面 | Vue 3 + Vite |
| 移动端壳 | 将 Web 端打包为 iOS/Android 应用，调用原生能力 | Capacitor |
| UI 组件库 | 统一按钮、输入框、对话气泡、侧边栏、设置表单等组件 | Element Plus / 自定义 |

### 4.2 应用层模块

| 模块 | 职责 |
|------|------|
| 对话交互 | 管理多轮对话、上下文切换、智能体切换、消息渲染与上下文记忆 |
| 智能体管理 | 智能体的增删改查、角色/模型/提示词/技能/知识库配置 |
| 技能管理 | 技能的定义、版本管理、编辑、启用/禁用、技能库浏览 |
| 知识库 | 文档上传、解析、向量化、语义检索、公共/私有知识库管理 |
| API 管理 | 第三方大模型 API 的配置、统一调用格式、密钥管理 |
| 任务编排 | 任务拆解、子任务分配、执行流程可视化、结果汇总展示 |

### 4.3 核心层模块

| 模块 | 职责 | 规划中的核心抽象 |
|------|------|------------------|
| 主智能体调度器 | 解析用户意图、拆解任务、匹配子智能体、汇总结果 | `SuperAgent`, `TaskPlanner`, `TaskOrchestrator` |
| 子智能体池 | 管理所有子智能体实例，支持并发执行与生命周期管理 | `AgentPool`, `AgentWorker`, `AgentRunner` |
| 技能执行引擎 | 解析技能定义、执行技能逻辑、管理输入输出与异常 | `SkillEngine`, `SkillExecutor`, `SkillRegistry` |
| 上下文管理器 | 维护全局共享上下文、对话历史、短期与长期记忆 | `ContextManager`, `MemoryStore` |
| 消息总线 | 提供智能体间异步通信、事件订阅发布机制 | `MessageBus`, `EventEmitter` |

### 4.4 数据层模块

| 模块 | 职责 | 规划中的核心抽象 |
|------|------|------------------|
| 结构化数据服务 | 存储智能体配置、技能定义、对话记录、API 配置 | `SQLiteStore`, `Repository<T>` |
| 向量数据服务 | 知识库文档的向量化存储与语义检索 | `VectorStore`, `EmbeddingService` |
| 文件存储服务 | 管理上传文档、图片、缓存文件 | `FileStore`, `FileManager` |
| 配置服务 | 管理系统设置、主题偏好、用户安全选项 | `ConfigService`, `SettingsStore` |

### 4.5 接入层模块

| 模块 | 职责 | 规划中的核心抽象 |
|------|------|------------------|
| 模型适配器 | 统一封装不同大模型后端的调用接口 | `LLMProvider`, `OpenAIAdapter`, `LocalModelAdapter` |
| API 网关 | 管理第三方 API 的注册、调用、限流与错误处理 | `APIGateway`, `APIRegistry` |
| 本地模型接口 | 对接本地推理服务（如 llama.cpp、Ollama 等兼容接口） | `LocalLLMClient` |

---

## 5. 智能体体系

### 5.1 主智能体（Super Agent）

- **定位：** 系统的核心调度者，具备全局视野。
- **职责：**
  1. 理解用户意图与任务目标
  2. 将复杂任务拆解为可独立执行的子任务
  3. 根据子任务类型匹配最合适的专项智能体
  4. 协调子智能体并行执行
  5. 收集子任务结果并整合为最终输出
  6. 可选：调用审核智能体进行质量校验

### 5.2 内置专项智能体

| 智能体 | 图标 | 核心能力 | 主要职责 |
|--------|------|----------|----------|
| 代码智能体 | 💻 | 编程开发任务 | 多语言代码生成、调试、审查、重构，内置代码执行沙箱 |
| 写作智能体 | ✍️ | 文本创作 | 文章、报告、邮件、文案创作，风格调整、润色、翻译 |
| 研究智能体 | 🔍 | 信息检索与深度分析 | 基于本地知识库与可选联网搜索进行研究、资料整理、报告撰写 |
| 审核智能体 | ✅ | 质量把控 | 对其他智能体输出进行审核、纠错、评分，可配置审核标准 |

### 5.3 自定义智能体配置维度

用户可创建自定义智能体，每个智能体包含以下配置：

- **基础信息**：名称、头像、描述、角色定位
- **模型配置**：选择后端（本地/云端）、温度参数、最大 token 数
- **系统提示词**：定义角色设定、行为准则、输出格式
- **技能绑定**：选择可调用的技能集合
- **知识库关联**：关联专属知识库，支持 RAG 增强
- **工具权限**：配置可使用的外部工具（文件读写、代码执行等）

---

## 6. 技能系统

### 6.1 技能定义要素

每个技能是一个独立的功能单元，包含：

| 要素 | 说明 | 示例 |
|------|------|------|
| 名称与描述 | 技能的唯一标识与功能说明 | 网页搜索、文件读取、代码执行 |
| 输入参数 | 执行所需的参数定义 | 搜索关键词、文件路径、代码内容 |
| 执行逻辑 | 技能的具体实现代码 | 调用搜索引擎 API、读取本地文件 |
| 输出格式 | 返回结果的结构定义 | 搜索结果列表、文件内容、执行输出 |
| 关联知识库 | 可选：执行时可检索的知识库 | 产品文档库、代码片段库 |
| 关联 API | 可选：调用的第三方 API 配置 | 天气 API、翻译 API、搜索 API |

### 6.2 内置技能清单

| 技能 | 说明 |
|------|------|
| 📁 文件操作 | 读取、写入、搜索本地文件，支持 TXT、MD、PDF、DOCX 等格式 |
| 🔎 知识库检索 | 对本地向量化知识库进行语义检索，返回相关片段用于 RAG 增强 |
| ⚙️ 代码执行 | 在安全沙箱中执行 Python、JavaScript 等代码，返回执行结果 |
| 🌐 网页访问 | 抓取网页内容、解析 HTML、提取关键信息（需联网，用户可选启用） |
| 🧮 计算工具 | 数学计算、单位换算、日期计算等实用计算能力 |
| 📊 数据处理 | 表格数据读写、数据清洗、统计分析、图表生成 |

### 6.3 技能共享机制

- 所有技能存储在统一的技能库中，不与特定智能体绑定。
- 每个智能体通过“技能清单”选择可调用技能。
- 技能更新后自动同步给所有使用该技能的智能体。
- 支持技能版本管理，可回滚到历史版本。

### 6.4 规划中核心抽象

| 抽象 | 职责 |
|------|------|
| `Skill` / `SkillDefinition` | 技能的数据模型，包含元数据、输入输出 Schema、执行脚本 |
| `SkillRegistry` | 技能注册中心，负责加载、查询、版本管理 |
| `SkillExecutor` | 执行单个技能的运行器，处理参数校验、执行、异常 |
| `SkillEngine` | 调度多个技能执行，管理依赖与结果传递 |

---

## 7. 数据存储设计

### 7.1 存储方案

采用 **SQLite + 文件系统** 混合存储：

| 数据类型 | 存储方式 | 说明 |
|----------|----------|------|
| 结构化数据 | SQLite | 智能体配置、技能定义、对话记录、API 配置 |
| 向量数据 | SQLite-vss 扩展 | 知识库向量化结果，支持语义检索 |
| 文件数据 | 本地文件系统 | 上传文档、图片、缓存 |
| 配置数据 | JSON 配置文件 | 系统设置、主题偏好 |

### 7.2 数据安全

- 数据库文件默认使用 **AES 加密** 存储，用户可设置访问密码。
- 卸载应用时，所有数据随应用目录一同删除，不留痕迹。
- 所有对话与知识库内容仅在本地处理，不上传至任何云端服务器。

### 7.3 关键数据实体（规划）

| 实体 | 主要字段（规划） |
|------|------------------|
| Agent | id, name, avatar, role, systemPrompt, modelConfig, skillIds, knowledgeBaseIds, toolPermissions, createdAt, updatedAt |
| Skill | id, name, description, version, inputSchema, outputSchema, executionCode, associatedKnowledgeBaseIds, associatedAPIIds |
| Conversation | id, agentId, title, messages, context, createdAt, updatedAt |
| Message | id, conversationId, role, content, metadata, timestamp |
| KnowledgeBase | id, name, description, type, embeddingModel, documentIds |
| Document | id, knowledgeBaseId, fileName, filePath, content, embeddingId, status |
| APIConfig | id, name, provider, baseUrl, apiKey, modelId, isDefault |
| Task | id, parentTaskId, agentId, status, input, output, dependencies, createdAt, completedAt |

---

## 8. 核心工作流

用户提交复杂任务后，系统按以下流程执行：

```
用户输入
    │
    ▼
[1] 任务理解 ──▶ 主智能体解析需求，明确目标与约束
    │
    ▼
[2] 任务拆解 ──▶ 拆分为若干可独立执行的子任务
    │
    ▼
[3] 智能体匹配 ──▶ 根据子任务类型匹配最合适的专项智能体
    │
    ▼
[4] 并行执行 ──▶ 多个子智能体同时执行，共享技能与知识库
    │
    ▼
[5] 结果汇总 ──▶ 主智能体收集结果，整合为最终输出
    │
    ▼
[6] 质量校验（可选）──▶ 审核智能体对结果进行质量把关
    │
    ▼
最终输出
```

---

## 9. 关键类与函数说明（规划阶段）

> 以下抽象与接口基于项目计划书推导，待代码实现后应替换为具体文件路径、类名与函数签名。

### 9.1 主智能体调度

| 规划抽象 | 类型 | 职责 |
|----------|------|------|
| `SuperAgent` | Class | 主智能体入口，负责接收用户输入并返回最终结果 |
| `TaskPlanner` | Class | 将用户任务拆解为子任务列表 |
| `TaskOrchestrator` | Class | 调度子任务执行，管理并行与依赖 |
| `AgentMatcher` | Class | 根据子任务特征匹配最合适的智能体 |
| `ResultAggregator` | Class | 汇总多个子任务输出为统一结果 |

**规划中关键方法：**

```typescript
// 主智能体处理用户请求
SuperAgent.process(input: UserInput): Promise<AgentOutput>

// 任务拆解
TaskPlanner.decompose(task: Task): Promise<SubTask[]>

// 子任务匹配智能体
AgentMatcher.match(subTask: SubTask, agents: Agent[]): Agent

// 执行编排
TaskOrchestrator.execute(subTasks: SubTask[]): Promise<SubTaskResult[]>

// 结果汇总
ResultAggregator.aggregate(results: SubTaskResult[]): AgentOutput
```

### 9.2 子智能体执行

| 规划抽象 | 类型 | 职责 |
|----------|------|------|
| `AgentPool` | Class | 管理所有子智能体实例 |
| `AgentWorker` | Class | 单个智能体工作单元，负责执行分配到的子任务 |
| `AgentRunner` | Class | 驱动智能体调用大模型、技能与知识库 |

**规划中关键方法：**

```typescript
// 获取可用智能体
AgentPool.getAvailableAgents(): Agent[]

// 分配任务给指定智能体
AgentPool.assign(task: SubTask, agentId: string): Promise<AgentWorker>

// 智能体执行任务
AgentWorker.execute(task: SubTask): Promise<SubTaskResult>

// 运行智能体调用链（模型 + 技能 + 知识库）
AgentRunner.run(agent: Agent, input: string, context: Context): Promise<string>
```

### 9.3 技能执行引擎

| 规划抽象 | 类型 | 职责 |
|----------|------|------|
| `SkillRegistry` | Class | 注册与管理所有可用技能 |
| `SkillExecutor` | Class | 执行单个技能 |
| `SkillEngine` | Class | 调度与编排技能执行 |

**规划中关键方法：**

```typescript
// 注册技能
SkillRegistry.register(skill: SkillDefinition): void

// 根据 ID 获取技能
SkillRegistry.get(skillId: string): SkillDefinition

// 执行技能
SkillExecutor.execute(skill: SkillDefinition, params: object): Promise<SkillOutput>

// 批量调度技能
SkillEngine.run(skills: SkillInvocation[], context: Context): Promise<SkillOutput[]>
```

### 9.4 上下文与记忆

| 规划抽象 | 类型 | 职责 |
|----------|------|------|
| `ContextManager` | Class | 管理全局上下文与对话历史 |
| `MemoryStore` | Class | 长期记忆存储与检索 |
| `MessageBus` | Class | 智能体间事件与消息通信 |

**规划中关键方法：**

```typescript
// 获取当前会话上下文
ContextManager.getContext(conversationId: string): Context

// 追加消息到上下文
ContextManager.appendMessage(conversationId: string, message: Message): void

// 检索相关记忆
MemoryStore.retrieve(query: string, limit: number): Promise<Memory[]>

// 发布事件
MessageBus.publish(event: AgentEvent): void

// 订阅事件
MessageBus.subscribe(eventType: string, handler: Handler): Unsubscriber
```

### 9.5 大模型接入

| 规划抽象 | 类型 | 职责 |
|----------|------|------|
| `LLMProvider` | Interface | 大模型提供者抽象 |
| `OpenAIAdapter` | Class | 对接 OpenAI 兼容 API |
| `LocalModelAdapter` | Class | 对接本地大模型服务 |
| `APIGateway` | Class | 管理第三方 API 调用 |

**规划中关键方法：**

```typescript
// 发送聊天请求
LLMProvider.chat(messages: Message[], options: ChatOptions): Promise<ChatResponse>

// 流式输出
LLMProvider.stream(messages: Message[], options: ChatOptions): AsyncIterable<ChatChunk>

// 调用第三方 API
APIGateway.invoke(apiId: string, params: object): Promise<APIResponse>
```

---

## 10. 依赖关系

### 10.1 模块间依赖

```
表现层
  │
  ├─▶ 应用层
  │     │
  │     ├─▶ 核心层
  │     │     │
  │     │     ├─▶ 数据层
  │     │     │
  │     │     └─▶ 接入层
  │     │
  │     └─▶ 数据层
  │
  └─▶ 核心层（桌面端 Main Process 直接调用部分核心服务）
```

### 10.2 关键依赖方向

| 上层 | 依赖下层 | 说明 |
|------|----------|------|
| 应用层 | 核心层 | 业务功能调用调度器、智能体池、技能引擎 |
| 核心层 | 数据层 | 读取智能体配置、保存对话记录、检索知识库 |
| 核心层 | 接入层 | 调用大模型 API 与第三方服务 |
| 表现层 | 应用层 | UI 调用业务服务获取数据与触发操作 |
| 接入层 | 数据层 | API 配置从配置服务读取 |

### 10.3 外部依赖（规划）

| 外部服务/库 | 用途 |
|-------------|------|
| OpenAI API / 兼容接口 | 云端大模型调用 |
| Anthropic API | Claude 系列模型调用 |
| Ollama / llama.cpp / 本地推理服务 | 本地大模型推理 |
| SQLite / better-sqlite3 | 本地结构化数据存储 |
| sqlite-vss | 本地向量检索 |
| 文件系统 | 文档、图片、缓存存储 |

---

## 11. 项目运行方式

### 11.1 开发环境要求（规划）

| 依赖 | 版本要求 |
|------|----------|
| Node.js | >= 18 LTS |
| pnpm / npm / yarn | 任一包管理器 |
| Git | 任意版本 |
| Python | 可选，用于本地模型服务或代码执行沙箱 |

### 11.2 目录结构（规划）

```
ai-agent-project/
├── apps/
│   ├── desktop/          # Electron 桌面端
│   ├── mobile/           # Capacitor 移动端
│   └── web/              # Web SPA
├── packages/
│   ├── core/             # 核心层：调度器、智能体、技能引擎
│   ├── data/             # 数据层：SQLite、向量库、文件存储
│   ├── adapter/          # 接入层：大模型适配器、API 网关
│   └── ui/               # 共享 UI 组件库
├── skills/               # 内置技能定义
├── docs/                 # 项目文档
├── scripts/              # 构建与发布脚本
├── package.json
├── turbo.json            # Monorepo 任务编排
└── README.md
```

### 11.3 常用命令（规划）

```bash
# 安装依赖
pnpm install

# 启动桌面端开发环境
pnpm dev:desktop

# 启动 Web 端开发环境
pnpm dev:web

# 启动移动端开发环境
pnpm dev:mobile

# 构建所有平台
pnpm build

# 打包桌面端安装包
pnpm build:desktop

# 运行代码检查
pnpm lint

# 运行单元测试
pnpm test
```

### 11.4 打包与发布（规划）

| 平台 | 输出格式 |
|------|----------|
| Windows | `.exe`, `.msi` |
| macOS | `.app`, `.dmg` |
| Linux | `.deb`, `.AppImage` |
| Android | `.apk`, `.aab` |
| iOS | `.ipa`（需开发者证书） |
| Web | 静态站点 |

---

## 12. 开发计划与里程碑

### 12.1 阶段划分

| 阶段 | 时间 | 核心目标 |
|------|------|----------|
| 第一阶段：核心框架 | 第 1-4 周 | 项目搭建、数据层、单智能体对话、基础 UI |
| 第二阶段：多智能体 | 第 5-9 周 | 智能体管理、任务编排、并行执行、消息总线 |
| 第三阶段：技能与知识 | 第 10-15 周 | 技能系统、知识库、API 管理 |
| 第四阶段：优化与发布 | 第 16-20 周 | 性能优化、多平台打包、测试与发布 |

### 12.2 里程碑

| 里程碑 | 时间 | 交付物 |
|--------|------|--------|
| M1 · 框架就绪 | 第 4 周末 | 可运行的桌面应用、单智能体对话 |
| M2 · 多智能体 | 第 9 周末 | 智能体管理、任务编排、并行执行 |
| M3 · 能力完整 | 第 15 周末 | 技能系统、知识库、API 管理 |
| M4 · 正式发布 | 第 20 周末 | v1.0 正式版、多平台安装包、用户文档 |

---

## 13. 风险与注意事项

| 风险点 | 影响 | 规划对策 |
|--------|------|----------|
| 本地大模型效果有限 | 高 | 支持混合模式（本地+云端）、RAG 增强、持续跟进开源模型 |
| 多智能体协作效率 | 中 | 任务复杂度评估、简单任务单智能体处理、模式切换 |
| 多平台适配复杂度 | 中 | 优先桌面端、核心逻辑与 UI 分离、渐进式适配 |
| 用户学习成本 | 中 | 开箱即用默认配置、新手引导、模板市场 |
| 本地资源占用 | 低 | 性能模式切换、并发数限制、向量检索优化 |

---

## 14. 附录：文档维护说明

- 本文档为 **v1.0 规划版**，应与代码实现保持同步更新。
- 关键类与函数说明部分目前为规划抽象，进入编码阶段后需替换为：
  - 真实文件路径与行号
  - 实际类名、接口名、函数签名
  - 参数类型、返回值类型与异常说明
- 建议在实现核心层后优先补充第 9 节内容，确保 Code Wiki 具备代码导航价值。
