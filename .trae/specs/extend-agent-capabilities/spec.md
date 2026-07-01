# 扩展智能体能力：对话助手、文件处理、内容生成、流程编排、定时任务 Spec

## Why
当前项目已具备基础智能体管理、聊天、自我成长和创建智能体的能力，但缺乏面向实际工作流的专用能力。通过为智能体扩展对话助手、文件处理、内容生成、流程编排和定时任务五大能力，可以让主智能体及自定义智能体完成更复杂的自动化任务。

## What Changes
- 在 `shared/skills.ts` 中新增或完善五类技能定义：对话助手、文件处理、内容生成、流程编排、定时任务。
- 为每类技能提供最小可用的执行函数与工具描述，便于智能体在运行时调用。
- 在智能体创建/进化流程中，允许为新智能体配置上述技能。
- 在前端智能体管理面板中展示技能标签与能力说明。
- 为定时任务提供基于 Makers 平台能力或本地 cron 的调用接口（最小实现）。

## Impact
- Affected specs: 智能体技能体系、智能体定义、创建/进化流程、前端智能体面板。
- Affected code: `shared/skills.ts`、`shared/agents.ts`、`shared/orchestrator.ts`、`shared/types.ts`、前端 `AgentsPanel.tsx` 及相关组件。

## ADDED Requirements
### Requirement: 对话助手技能
The system SHALL 提供对话助手技能，使智能体能够进行多轮上下文对话、总结对话内容、提取关键信息。

#### Scenario: 使用对话助手技能
- **WHEN** 智能体被配置对话助手技能并收到用户消息
- **THEN** 智能体基于上下文生成回复
- **AND** 可调用 `summarizeConversation` 工具总结历史对话

### Requirement: 文件处理技能
The system SHALL 提供文件处理技能，使智能体能够读取、解析、保存和列出文件。

#### Scenario: 处理用户上传文件
- **WHEN** 用户向智能体提供文件路径或文件内容
- **THEN** 智能体可读取文件内容
- **AND** 可生成摘要、转换格式或保存新文件

### Requirement: 内容生成技能
The system SHALL 提供内容生成技能，使智能体能够根据提示生成文本、代码、文档或结构化数据。

#### Scenario: 生成内容
- **WHEN** 用户请求智能体生成内容
- **THEN** 智能体调用内容生成工具
- **AND** 返回生成的文本或代码

### Requirement: 流程编排技能
The system SHALL 提供流程编排技能，使主智能体能够将复杂任务拆解为子任务，并调度其他智能体或工具按顺序/并行执行。

#### Scenario: 编排多步骤任务
- **WHEN** 用户提交一个复杂请求
- **THEN** 主智能体拆分子任务
- **AND** 按依赖关系调用其他智能体或工具
- **AND** 汇总结果返回给用户

### Requirement: 定时任务技能
The system SHALL 提供定时任务技能，使智能体能够创建、列出、暂停和删除定时任务。

#### Scenario: 创建定时任务
- **WHEN** 用户要求智能体在指定时间或周期执行某项操作
- **THEN** 智能体创建定时任务记录
- **AND** 到达触发条件时执行对应操作

## MODIFIED Requirements
### Requirement: 智能体定义支持技能绑定
The system SHALL 允许在 `AgentDefinition` 中绑定上述五类技能，并在创建/进化智能体时选择可用技能。

#### Scenario: 创建具备文件处理能力的智能体
- **WHEN** 用户创建新智能体并选择文件处理技能
- **THEN** 智能体定义中保存技能列表
- **AND** 运行时智能体可调用对应工具

## REMOVED Requirements
无。
