# 增强设置界面与 Compose 编排模式 Spec

## Why
当前设置页面缺少模型 Provider、Agent 权限、检查点/记忆行为、MCP 服务器、快捷键与主题等关键配置入口；同时项目缺乏从 spec 到交付的结构化开发流程，难以系统性地完成复杂功能。需要统一扩展设置界面，并引入 Compose 编排模式，将规划、执行、审查、TDD、调试、验证、合并等环节编排为可复用的开发生命周期。

## What Changes
- 扩展 `SettingsPanel.tsx`，新增以下配置区域：
  - Provider 与模型选择
  - Agent 权限与自定义 Agent
  - 检查点和记忆行为
  - MCP 服务器连接
  - 快捷键与主题
- 新增 `shared/compose/` 模块，实现 Compose 编排模式：
  - `planner.ts` — 从 spec 生成任务计划
  - `executor.ts` — 按计划调用技能/subagent 执行
  - `reviewer.ts` — 代码审查与反馈
  - `tdd.ts` — 测试驱动开发支持
  - `debugger.ts` — 诊断与修复
  - `validator.ts` — 验证与检查清单核对
  - `merger.ts` — 合并与收尾
- 新增 `agent_compose` 智能体，内置 Compose 模式技能绑定。
- 新增 `/compose` 聊天命令，触发 Compose 编排流程。
- 更新 `shared/store.ts` 注册新的 Compose 相关技能与智能体。
- 更新 `src/i18n/en.ts` 与 `src/i18n/zh.ts` 添加新设置项与 Compose 模式翻译。
- 更新 `docs/modules.md` 与 README，说明新设置项和 Compose 模式。
- **BREAKING**: Settings 页面结构变化；原有部分设置项可能需要调整位置。

## Impact
- Affected specs: UI 设置、智能体能力、技能体系、开发工作流、项目文档。
- Affected code: `src/components/SettingsPanel.tsx`、`src/lib/appConfig.ts`、`src/i18n/*.ts`、`shared/store.ts`、`shared/compose/*.ts`（新增）、`agents/chat/index.ts`、文档。

## ADDED Requirements
### Requirement: Provider 和模型选择
The system SHALL 在设置界面提供 Provider 和模型选择配置。

#### Scenario: 用户切换模型
- **WHEN** 用户在设置中选择 Provider 和模型
- **THEN** 应用保存配置
- **AND** 新对话默认使用该模型

### Requirement: Agent 权限和自定义 Agent
The system SHALL 在设置界面提供 Agent 权限配置和自定义 Agent 入口。

#### Scenario: 调整 Agent 权限
- **WHEN** 用户在设置中修改某个 Agent 的权限
- **THEN** 对应 Agent 的 `toolPermissions` 更新
- **AND** 该 Agent 后续执行时遵守新权限

#### Scenario: 创建自定义 Agent
- **WHEN** 用户在设置中填写名称、描述、system prompt、技能绑定并保存
- **THEN** 创建新的 AgentDefinition
- **AND** 新 Agent 出现在 AgentsPanel 中

### Requirement: 检查点和记忆行为
The system SHALL 在设置界面提供检查点与记忆行为配置。

#### Scenario: 调整上下文管理参数
- **WHEN** 用户在设置中修改上下文窗口、检查点阈值、重建阈值等
- **THEN** 智能上下文管理模块使用新参数

### Requirement: MCP 服务器连接
The system SHALL 在设置界面提供 MCP 服务器连接配置。

#### Scenario: 配置 MCP 服务器
- **WHEN** 用户添加/编辑/删除 MCP 服务器 URL 和认证信息
- **THEN** 系统保存配置并尝试连接
- **AND** 连接成功后该 MCP 服务器可作为工具来源

### Requirement: 快捷键和主题
The system SHALL 在设置界面提供快捷键和主题配置。

#### Scenario: 切换主题
- **WHEN** 用户选择浅色/深色/跟随系统主题
- **THEN** 界面立即应用对应主题

#### Scenario: 修改快捷键
- **WHEN** 用户修改某个快捷键绑定
- **THEN** 新快捷键生效并保存

### Requirement: Dream 知识提取
The system SHALL 提供 `/dream` 命令，扫描近期会话轨迹，提取持久知识到项目记忆，并清理过时条目。

#### Scenario: 执行 /dream
- **WHEN** 用户在聊天中输入 `/dream`
- **THEN** 系统分析近期会话
- **AND** 将高价值信息写入 `MEMORY.md` 或 SQLite 记忆
- **AND** 标记或删除过期记忆

### Requirement: Distill 工作流提炼
The system SHALL 提供 `/distill` 命令，发现近期重复手动工作流，将高置信度候选打包成可复用 skill、subagent 或 command。

#### Scenario: 执行 /distill
- **WHEN** 用户在聊天中输入 `/distill`
- **THEN** 系统扫描近期操作日志
- **AND** 识别重复模式
- **AND** 生成 skill / subagent / command 提案并供用户确认

### Requirement: Compose 编排模式
The system SHALL 提供 Compose 模式，支持从 spec 到交付的完整开发生命周期编排。

#### Scenario: 启动 Compose 模式
- **WHEN** 用户在聊天中输入 `/compose <spec>` 或选择 Compose 智能体
- **THEN** `agent_compose` 按以下阶段推进：规划 → 执行 → 审查 → TDD → 调试 → 验证 → 合并
- **AND** 每个阶段可自动或手动确认继续

#### Scenario: Compose 阶段执行
- **WHEN** Compose 进入执行阶段
- **THEN** 调用相应 subagent 或 skill 完成代码实现
- **AND** 输出阶段结果到会话

## MODIFIED Requirements
### Requirement: 设置页面
The system SHALL 在现有设置页面基础上扩展多个配置 Tab，统一入口并支持搜索/筛选。

#### Scenario: 打开设置
- **WHEN** 用户打开设置
- **THEN** 左侧显示分类导航：通用、模型、Agent、上下文、MCP、快捷键、主题
- **AND** 右侧显示对应配置面板

## REMOVED Requirements
无。
