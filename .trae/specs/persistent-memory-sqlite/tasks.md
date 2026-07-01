# Tasks

- [x] Task 1: 调研当前记忆相关代码与 SQLite 运行环境
  - [x] SubTask 1.1: 读取 `shared/store.ts`，了解当前 MemoryStore / KVStore 结构
  - [x] SubTask 1.2: 读取 `shared/orchestrator.ts`，了解上下文组装流程
  - [x] SubTask 1.3: 读取 `agents/chat/index.ts`，了解聊天接口如何接收 env 和调用 orchestrator
  - [x] SubTask 1.4: 读取 `src/api.ts`，了解前端如何恢复会话历史
  - [x] SubTask 1.5: 确认项目运行环境（Node.js / EdgeOne / 浏览器）对 SQLite 的可用性

- [x] Task 2: 安装 SQLite 依赖并设计记忆数据库 Schema
  - [x] SubTask 2.1: 安装 `better-sqlite3` 或 `node-sqlite3-wasm`，确认 FTS5 可用
  - [x] SubTask 2.2: 设计 `memories` 表字段：`id`、`type`、`scope`、`title`、`content`、`metadata`、`created_at`、`updated_at`
  - [x] SubTask 2.3: 创建 FTS5 虚拟表 `memories_fts`，索引 `title` 和 `content`
  - [x] SubTask 2.4: 设计 `checkpoints` 表：`conversation_id`、`content`、`updated_at`

- [x] Task 3: 实现记忆存储与搜索模块
  - [x] SubTask 3.1: 创建 `shared/memory/sqlite.ts`，封装数据库初始化、表创建、连接管理
  - [x] SubTask 3.2: 创建 `shared/memory/store.ts`，提供 `addMemory`、`updateMemory`、`searchMemories`、`deleteMemory`、`clearAll`
  - [x] SubTask 3.3: 创建 `shared/memory/checkpoint.ts`，提供 `loadCheckpoint`、`saveCheckpoint`、`listCheckpoints`
  - [x] SubTask 3.4: 创建 `shared/memory/tasks.ts`，提供 `loadTaskProgress`、`appendTaskProgress`
  - [x] SubTask 3.5: 创建 `shared/memory/notes.ts`，提供 `loadNotes`、`appendNote`
  - [x] SubTask 3.6: 为记忆模块编写单元测试（可选）

- [x] Task 4: 实现记忆与 Markdown 文件的双向同步
  - [x] SubTask 4.1: 创建 `shared/memory/sync.ts`，在 SQLite 与 `MEMORY.md`、`notes.md`、`tasks/<id>/progress.md` 之间同步
  - [x] SubTask 4.2: 设计同步策略：写入 SQLite 时异步写回 Markdown；启动时从 Markdown 导入到 SQLite
  - [x] SubTask 4.3: 确保 Markdown 文件人类可读，作为主要持久化载体；SQLite 作为检索索引

- [x] Task 5: 实现 checkpoint-writer 子智能体
  - [x] SubTask 5.1: 在 `shared/agents.ts` 中新增 `agent_checkpoint_writer` 内置智能体定义
  - [x] SubTask 5.2: 设计 checkpoint-writer 的 system prompt：从会话历史中提炼关键决策、进展、待办
  - [x] SubTask 5.3: 在 `shared/orchestrator.ts` 的合适时机调用 checkpoint-writer 更新检查点
  - [x] SubTask 5.4: 限制 checkpoint 更新频率（如每 N 条消息或重要事件触发）

- [x] Task 6: 在会话恢复时自动注入记忆
  - [x] SubTask 6.1: 修改 `agents/chat/index.ts`，在 `/chat` 处理时读取 conversation 对应的 checkpoint
  - [x] SubTask 6.2: 修改 `shared/orchestrator.ts`，根据用户输入搜索相关记忆并注入 system prompt
  - [x] SubTask 6.3: 确保注入格式固定且不会超出 token 限制（截断或摘要）

- [x] Task 7: 扩展设置页面记忆管理
  - [x] SubTask 7.1: 在 `SettingsPanel.tsx` 添加「记忆管理」Tab 或区域
  - [x] SubTask 7.2: 显示记忆统计：总条数、各类型数量、数据库大小
  - [x] SubTask 7.3: 实现「清空所有记忆」按钮，需二次确认
  - [x] SubTask 7.4: 添加 i18n 翻译 key

- [x] Task 8: 更新云端函数兼容性与文档
  - [x] SubTask 8.1: 在 `agents/chat/index.ts` 中 gracefully 处理 SQLite 不可用场景（EdgeOne Functions 无文件系统），回退到仅 MemoryStore
  - [x] SubTask 8.2: 更新 `docs/modules.md`，添加记忆模块说明
  - [x] SubTask 8.3: 更新 README.md 和 README_zh-CN.md，说明本地记忆能力

- [x] Task 9: 构建与验证
  - [x] SubTask 9.1: 运行 `npx tsc --noEmit` 确认无类型错误
  - [x] SubTask 9.2: 运行记忆模块单元测试（如有）
  - [x] SubTask 9.3: 运行 `npm run build` 确认 Web 构建成功
  - [x] SubTask 9.4: 运行 `npm run build:desktop` 确认桌面端构建成功
  - [x] SubTask 9.5: 手动测试会话恢复时记忆注入效果

# Task Dependencies
- Task 2 依赖于 Task 1
- Task 3 依赖于 Task 2
- Task 4 依赖于 Task 3
- Task 5 依赖于 Task 3
- Task 6 依赖于 Task 4 和 Task 5
- Task 7 可并行于 Task 6
- Task 8 依赖于 Task 6
- Task 9 依赖于 Task 7 和 Task 8
