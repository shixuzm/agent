# Tasks

- [x] Task 1: 调研现有设置页面与 Compose 相关能力
  - [x] SubTask 1.1: 读取 `src/components/SettingsPanel.tsx`，确认当前设置结构
  - [x] SubTask 1.2: 读取 `src/lib/appConfig.ts`，确认当前配置字段与默认值
  - [x] SubTask 1.3: 读取 `shared/store.ts`，确认 Agent/Skill 注册方式
  - [x] SubTask 1.4: 读取 `shared/skills.ts`，确认 skill handler 签名
  - [x] SubTask 1.5: 读取 `shared/types.ts`，确认 AgentDefinition/SkillDefinition 字段
  - [x] SubTask 1.6: 读取 `agents/chat/index.ts`，确认命令解析方式
  - [x] SubTask 1.7: 读取 `src/i18n/en.ts` 和 `src/i18n/zh.ts`，确认 i18n 结构

- [x] Task 2: 扩展应用配置模型
  - [x] SubTask 2.1: 在 `AppConfig` 中添加 provider、modelId、theme、shortcuts、agents、mcps 等字段
  - [x] SubTask 2.2: 更新默认值和本地存储序列化/反序列化
  - [x] SubTask 2.3: 添加配置校验 helper

- [x] Task 3: 重构设置页面为分类导航布局
  - [x] SubTask 3.1: 在 `SettingsPanel.tsx` 中实现左侧分类导航
  - [x] SubTask 3.2: 实现「Provider 和模型选择」面板
  - [x] SubTask 3.3: 实现「Agent 权限和自定义 Agent」面板
  - [x] SubTask 3.4: 实现「检查点和记忆行为」面板
  - [x] SubTask 3.5: 实现「MCP 服务器连接」面板
  - [x] SubTask 3.6: 实现「快捷键和主题」面板
  - [x] SubTask 3.7: 添加搜索/筛选能力

- [x] Task 4: 实现 Dream 与 Distill 命令
  - [x] SubTask 4.1: 创建 `shared/dream.ts`，实现扫描近期会话并提取持久知识
  - [x] SubTask 4.2: 创建 `shared/distill.ts`，实现发现重复工作流并生成 skill/subagent/command 提案
  - [x] SubTask 4.3: 在 `agents/chat/index.ts` 中识别 `/dream` 和 `/distill` 命令
  - [x] SubTask 4.4: 将 Dream/Distill 作为技能注册到 `shared/store.ts`

- [x] Task 5: 实现 Compose 编排模式核心模块
  - [x] SubTask 5.1: 创建 `shared/compose/types.ts` 定义 ComposePhase / ComposePlan / ComposeResult
  - [x] SubTask 5.2: 创建 `shared/compose/planner.ts` 从 spec 生成阶段计划
  - [x] SubTask 5.3: 创建 `shared/compose/executor.ts` 调用技能/subagent 执行
  - [x] SubTask 5.4: 创建 `shared/compose/reviewer.ts` 代码审查
  - [x] SubTask 5.5: 创建 `shared/compose/tdd.ts` 测试驱动开发支持
  - [x] SubTask 5.6: 创建 `shared/compose/debugger.ts` 诊断修复
  - [x] SubTask 5.7: 创建 `shared/compose/validator.ts` 验证检查清单
  - [x] SubTask 5.8: 创建 `shared/compose/merger.ts` 合并收尾
  - [x] SubTask 5.9: 创建 `shared/compose/index.ts` 编排器串联各阶段

- [x] Task 6: 注册 Compose 智能体与技能
  - [x] SubTask 6.1: 在 `shared/store.ts` 中注册 `agent_compose`
  - [x] SubTask 6.2: 为 `agent_compose` 绑定 Compose 相关 skills
  - [x] SubTask 6.3: 在 `agents/chat/index.ts` 中识别 `/compose <spec>` 命令

- [x] Task 7: 更新 i18n
  - [x] SubTask 7.1: 在 `src/i18n/en.ts` 中添加设置项和 Compose 模式翻译
  - [x] SubTask 7.2: 在 `src/i18n/zh.ts` 中添加设置项和 Compose 模式翻译

- [x] Task 8: 更新文档
  - [x] SubTask 8.1: 更新 `docs/modules.md`，添加 Compose 模块和设置项说明
  - [x] SubTask 8.2: 更新 README.md 和 README_zh-CN.md

- [x] Task 9: 构建与验证
  - [x] SubTask 9.1: 运行 `npx tsc --noEmit` 确认无类型错误
  - [x] SubTask 9.2: 运行 `npm run build` 确认 Web 构建成功
  - [x] SubTask 9.3: 运行 `npm run build:desktop` 确认桌面端构建成功

- [x] Task 10: 修复 CI 下桌面端构建自动发布失败
  - [x] SubTask 10.1: 在 `package.json` 的 `build` 配置中设置 `publish` 为 `null`
  - [x] SubTask 10.2: 重新运行 `npm run build:desktop` 验证通过

# Task Dependencies
- Task 2 依赖于 Task 1
- Task 3 依赖于 Task 2
- Task 4 可并行于 Task 3
- Task 5 可并行于 Task 3
- Task 6 依赖于 Task 5
- Task 7 依赖于 Task 3 和 Task 6
- Task 8 依赖于 Task 6
- Task 9 依赖于 Task 7 和 Task 8
