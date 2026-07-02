# Tasks

- [x] Task 1: 调研当前上下文与任务相关代码
  - [x] SubTask 1.1: 读取 `shared/types.ts`，确认 Task / Conversation / Message 类型定义
  - [x] SubTask 1.2: 读取 `shared/store.ts`，确认任务和会话的存储接口
  - [x] SubTask 1.3: 读取 `shared/orchestrator.ts`，确认上下文组装与 checkpoint 调用位置
  - [x] SubTask 1.4: 读取 `shared/memory/checkpoint.ts` 和 `shared/memory/tasks.ts`，确认现有检查点和任务进展接口
  - [x] SubTask 1.5: 确认当前是否已有 token 估算工具或模型上下文窗口配置

- [x] Task 2: 扩展类型定义支持树状任务
  - [x] SubTask 2.1: 在 `shared/types.ts` 中为 `Task` 添加 `parentTaskId?: string`、`subTaskIds?: string[]`、`status`、`progress`
  - [x] SubTask 2.2: 为 `Conversation` 添加 `contextWindow`、`modelName`、`tokenUsage` 等元数据字段
  - [x] SubTask 2.3: 为 `AgentDefinition` 或配置添加 `contextWindow` / `maxTokens` 字段

- [x] Task 3: 实现 Token 预算管理器
  - [x] SubTask 3.1: 创建 `shared/context/budget.ts`，定义 `ContextBudget` 接口
  - [x] SubTask 3.2: 实现 `estimateTokens(text)` 函数（基于字符数或简单 tokenizer）
  - [x] SubTask 3.3: 实现 `createBudget(modelName, usedTokens)` 根据模型上下文窗口分配子预算
  - [x] SubTask 3.4: 实现 `shouldSaveCheckpoint(budget, messages)` 判断逻辑
  - [x] SubTask 3.5: 实现 `truncateToBudget(items, budget, scorer)` 通用截断函数

- [x] Task 4: 实现上下文重建逻辑
  - [x] SubTask 4.1: 创建 `shared/context/rebuild.ts`，实现 `rebuildContext(params)`
  - [x] SubTask 4.2: 参数包含：最新 checkpoint、项目记忆、任务进展、近期消息、用户输入、预算
  - [x] SubTask 4.3: 按优先级组装上下文：checkpoint → 当前任务进展 → 相关记忆 → 近期消息
  - [x] SubTask 4.4: 超过预算时从低优先级项开始截断
  - [x] SubTask 4.5: 返回重建后的 messages 数组和是否需要保存 checkpoint 的标志

- [x] Task 5: 重构检查点管理模块
  - [x] SubTask 5.1: 创建 `shared/context/checkpoint.ts`，整合 checkpoint 保存/加载/自动触发
  - [x] SubTask 5.2: 实现 `maybeSaveCheckpoint(store, conversation, budget)`，根据预算自动触发
  - [x] SubTask 5.3: 从 `shared/orchestrator.ts` 迁移 checkpoint 相关逻辑到 `shared/context/checkpoint.ts`
  - [x] SubTask 5.4: 保留与 `shared/memory/checkpoint.ts` 的调用关系，保存位置不变

- [x] Task 6: 实现树状任务系统
  - [x] SubTask 6.1: 创建 `shared/context/tasks.ts`（或复用 `shared/memory/tasks.ts`），支持父子任务
  - [x] SubTask 6.2: 实现 `createSubTask(parentTaskId, title)` 自动生成 T1.1 格式 ID
  - [x] SubTask 6.3: 实现 `getTaskTree(store, rootTaskId)` 递归获取任务树
  - [x] SubTask 6.4: 实现 `summarizeTaskProgress(taskTree)` 生成任务进展文本
  - [x] SubTask 6.5: 修改 `shared/store.ts` 的 Task 存储方法，支持 parentTaskId 查询

- [x] Task 7: 在 Orchestrator 中集成智能上下文管理
  - [x] SubTask 7.1: 在 `planAndExecute` 开头计算当前消息 token 使用量
  - [x] SubTask 7.2: 调用 `maybeSaveCheckpoint` 自动保存检查点
  - [x] SubTask 7.3: 当接近上下文上限时，调用 `rebuildContext` 重建上下文
  - [x] SubTask 7.4: 将预算化注入的记忆/任务进展拼接到 system prompt 或 messages
  - [x] SubTask 7.5: 更新 `executeAgentTask` 使用重建后的 messages

- [x] Task 8: 在 Chat 接口中支持上下文重建
  - [x] SubTask 8.1: 在 `agents/chat/index.ts` 中接收 model 配置或上下文窗口参数
  - [x] SubTask 8.2: 将会话元数据（token usage）保存到 conversation
  - [x] SubTask 8.3: 确保云端函数和直连模式都走同一套 rebuild 逻辑

- [x] Task 9: 扩展设置页面
  - [x] SubTask 9.1: 在 `SettingsPanel.tsx` 添加「上下文管理」配置区域
  - [x] SubTask 9.2: 支持配置上下文窗口大小、检查点阈值、保留近期消息数量
  - [x] SubTask 9.3: 添加 i18n 翻译 key

- [x] Task 10: 更新文档
  - [x] SubTask 10.1: 更新 `docs/modules.md`，添加上下文管理模块说明
  - [x] SubTask 10.2: 更新 README.md 和 README_zh-CN.md，说明自动检查点、上下文重建、预算化注入、树状任务

- [x] Task 11: 构建与验证
  - [x] SubTask 11.1: 运行 `npx tsc --noEmit` 确认无类型错误
  - [x] SubTask 11.2: 创建测试脚本 `scripts/test-context-management.js`，验证预算计算、上下文重建、树状任务
  - [x] SubTask 11.3: 运行 `npm run build` 确认 Web 构建成功
  - [x] SubTask 11.4: 运行 `npm run build:desktop` 确认桌面端构建成功

# Task Dependencies
- Task 2 依赖于 Task 1
- Task 3 依赖于 Task 2
- Task 4 依赖于 Task 3
- Task 5 依赖于 Task 4
- Task 6 依赖于 Task 2
- Task 7 依赖于 Task 5 和 Task 6
- Task 8 依赖于 Task 7
- Task 9 可并行于 Task 8
- Task 10 依赖于 Task 8
- Task 11 依赖于 Task 9 和 Task 10
