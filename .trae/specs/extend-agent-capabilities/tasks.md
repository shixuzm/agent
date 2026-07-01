# Tasks

- [x] Task 1: 调研当前技能与智能体定义实现
  - [x] SubTask 1.1: 读取 `shared/types.ts`，确认 `AgentDefinition`、`Skill`、`Tool` 等类型定义
  - [x] SubTask 1.2: 读取 `shared/skills.ts`，了解现有技能注册与执行方式
  - [x] SubTask 1.3: 读取 `shared/agents.ts` 和 `shared/orchestrator.ts`，了解智能体调用技能的流程
  - [x] SubTask 1.4: 读取前端 `AgentsPanel.tsx`，了解技能展示与选择方式

- [x] Task 2: 扩展类型定义支持新技能
  - [x] SubTask 2.1: 在 `shared/types.ts` 中补充新技能的类型或枚举
  - [x] SubTask 2.2: 确保 `AgentDefinition` 中的 `skills` 字段可以绑定新技能

- [x] Task 3: 实现对话助手技能
  - [x] SubTask 3.1: 在 `shared/skills.ts` 中注册 `dialogue_assistant` 技能
  - [x] SubTask 3.2: 提供 `summarizeConversation` 工具实现
  - [x] SubTask 3.3: 为对话助手技能编写工具描述（description/parameters）

- [x] Task 4: 实现文件处理技能
  - [x] SubTask 4.1: 在 `shared/skills.ts` 中注册 `file_handler` 技能
  - [x] SubTask 4.2: 提供 `readFile`、`writeFile`、`listFiles` 最小实现
  - [x] SubTask 4.3: 注意沙箱/边缘函数中的文件系统限制，使用安全路径

- [x] Task 5: 实现内容生成技能
  - [x] SubTask 5.1: 在 `shared/skills.ts` 中注册 `content_generator` 技能
  - [x] SubTask 5.2: 提供 `generateText`、`generateCode` 工具实现
  - [x] SubTask 5.3: 复用 `shared/llm.ts` 调用 LLM 完成生成

- [x] Task 6: 实现流程编排技能
  - [x] SubTask 6.1: 在 `shared/skills.ts` 中注册 `workflow_orchestrator` 技能
  - [x] SubTask 6.2: 提供 `createPlan`、`executeStep` 工具实现
  - [x] SubTask 6.3: 在 `shared/orchestrator.ts` 中支持按 plan 调用其他智能体或工具

- [x] Task 7: 实现定时任务技能
  - [x] SubTask 7.1: 在 `shared/skills.ts` 中注册 `scheduler` 技能
  - [x] SubTask 7.2: 提供 `createScheduledTask`、`listScheduledTasks`、`deleteScheduledTask` 工具实现
  - [x] SubTask 7.3: 将定时任务记录持久化到 Store（KV/Memory）

- [x] Task 8: 更新前端智能体面板
  - [x] SubTask 8.1: 在 `AgentsPanel.tsx` 中展示技能标签
  - [x] SubTask 8.2: 在创建/编辑智能体时支持选择这五类技能
  - [x] SubTask 8.3: 在智能体详情中展示已绑定技能

- [x] Task 9: 更新内置智能体与示例
  - [x] SubTask 9.1: 为主智能体（master）默认绑定流程编排和对话助手技能
  - [x] SubTask 9.2: 在 `shared/store.ts` 中更新默认智能体配置

- [x] Task 10: 构建与验证
  - [x] SubTask 10.1: 运行 `npx tsc --noEmit` 确认无类型错误
  - [x] SubTask 10.2: 运行 `npm run build` 确认本地构建成功
  - [x] SubTask 10.3: 运行 `npm run build:cloud` 确认云端构建成功

# Task Dependencies
- Task 2 依赖于 Task 1
- Task 3、4、5、6、7 依赖于 Task 2（可并行）
- Task 8 依赖于 Task 3、4、5、6、7
- Task 9 依赖于 Task 2
- Task 10 依赖于 Task 8 和 Task 9
