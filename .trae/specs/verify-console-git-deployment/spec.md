# 验证控制台 Git 快速部署完整功能 Spec

## Why
项目已完成 EdgeOne Makers 接入、KV 持久化、智能体自我成长与创建等核心功能，但尚未验证通过腾讯云控制台直接导入 `shixuzm/agent` 仓库的 `agent` 分支进行快速部署后，所有功能是否都能正常运行。需要在实施阶段前制定清晰的验证计划与验收标准。

## What Changes
- 无代码变更。本次 change 为纯验证任务。
- 生成部署验证报告，记录部署步骤、问题与修复建议。
- 若验证中发现阻塞性问题，将单独创建 follow-up change 进行修复。

## Impact
- Affected specs: EdgeOne Makers 部署流程、KV 持久化、智能体管理、聊天功能、历史记录、自我成长/创建智能体。
- Affected code: 当前仓库全部代码，重点关注 `edgeone.json`、`.env.example`、`shared/kvStore.ts`、`shared/store.ts`、云函数与前端组件。

## ADDED Requirements
### Requirement: 部署前代码自检
The system SHALL 在触发控制台部署前完成本地/沙箱层面的代码与配置检查，确保仓库处于可部署状态。

#### Scenario: 配置检查通过
- **WHEN** 检查 `edgeone.json`
- **THEN** `kvNamespaces[0].id` 不应为 `REPLACE_WITH_YOUR_KV_NAMESPACE_ID`，或至少在验证报告中明确提示必须替换。
- **AND** `buildCommand`、`outputDirectory`、`agents.framework` 等关键字段存在且合理。

#### Scenario: 构建检查通过
- **WHEN** 运行 `npm ci && npm run build`
- **THEN** 构建成功退出，无致命错误。

### Requirement: 控制台 Git 导入部署
The system SHALL 能够通过腾讯云 EdgeOne Makers 控制台，使用 Git 导入方式部署 `https://github.com/shixuzm/agent` 的 `agent` 分支。

#### Scenario: 快速部署成功
- **WHEN** 用户在控制台选择「导入 Git 仓库」，填写仓库地址与分支 `agent`
- **THEN** 控制台完成构建并发布，返回可访问的站点 URL。
- **AND** 站点首页能正常加载，无 5xx 错误。

### Requirement: 功能完整性验证
The system SHALL 在部署成功后验证核心功能端到端可用。

#### Scenario: 聊天功能正常
- **WHEN** 用户在部署站点发送一条消息
- **THEN** 页面收到助手回复，且回复内容合理。

#### Scenario: 历史记录持久化
- **WHEN** 用户刷新页面后重新进入同一会话
- **THEN** 历史消息正确恢复。

#### Scenario: 智能体管理面板展示全部智能体
- **WHEN** 用户打开智能体页面
- **THEN** 页面展示所有内置与自定义智能体。

#### Scenario: 主智能体创建新智能体
- **WHEN** 用户通过主智能体发送创建智能体的自然语言指令
- **THEN** 新智能体被注册并在智能体页面可见。

#### Scenario: 智能体自我成长
- **WHEN** 触发智能体进化流程（如通过相关技能或足够轮次的对话）
- **THEN** 智能体 systemPrompt 或进化代数发生预期更新，且不引发错误。

## MODIFIED Requirements
无。

## REMOVED Requirements
无。
