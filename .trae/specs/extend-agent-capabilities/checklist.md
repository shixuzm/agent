# Checklist

- [x] 已读取 `shared/types.ts`、`shared/skills.ts`、`shared/agents.ts`、`shared/orchestrator.ts`、前端 `AgentsPanel.tsx`
- [x] `shared/types.ts` 已支持新技能类型绑定
- [x] 对话助手技能已注册并提供 `summarizeConversation` 工具
- [x] 文件处理技能已注册并提供 `readFile`、`writeFile`、`listFiles` 工具
- [x] 内容生成技能已注册并提供 `generateText`、`generateCode` 工具
- [x] 流程编排技能已注册并提供 `createPlan`、`executeStep` 工具
- [x] 定时任务技能已注册并提供 `createScheduledTask`、`listScheduledTasks`、`deleteScheduledTask` 工具
- [x] 定时任务记录持久化到 Store
- [x] 前端 `AgentsPanel.tsx` 支持展示和选择新技能
- [x] 主智能体默认绑定流程编排和对话助手技能
- [x] `npx tsc --noEmit` 无类型错误
- [x] `npm run build` 构建成功
- [x] `npm run build:cloud` 构建成功
