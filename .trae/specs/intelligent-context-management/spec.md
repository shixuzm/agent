# 智能上下文管理 Spec

## Why
当前智能体在长会话中无法感知上下文窗口限制，导致接近上限时性能下降或触发错误；同时缺乏自动保存、上下文重建和任务进度追踪机制。需要通过智能上下文管理，在合适的时机自动保存检查点，并在上下文接近上限时基于 checkpoint、记忆和任务进展重建有效上下文，保证长任务连续执行不丢失进度。

## What Changes
- 新增上下文预算管理器，基于 token 预算决定何时保存检查点、注入多少记忆/任务进展。
- 重构检查点机制：由被动触发改为根据上下文窗口使用比例自动触发。
- 新增上下文重建逻辑：当上下文接近上限时，从最新 checkpoint + 项目记忆 + 任务进展 + 保留的近期消息重建精简上下文。
- 扩展任务系统为树状结构（T1, T1.1, T1.2…），并支持与检查点联动。
- 在 orchestrator 和 chat 接口中集成上下文预算化注入。
- 更新文档说明新的上下文管理机制。

## Impact
- Affected specs: 会话管理、检查点系统、记忆系统、任务系统、上下文注入。
- Affected code: `shared/context/budget.ts`（新增）、`shared/context/rebuild.ts`（新增）、`shared/context/checkpoint.ts`（新增/重构）、`shared/orchestrator.ts`、`shared/store.ts`、`shared/types.ts`、`shared/memory/checkpoint.ts`、`agents/chat/index.ts`、Settings 面板、文档。

## ADDED Requirements
### Requirement: Token 预算管理
The system SHALL 维护当前会话的 token 预算，并据此决定检查点保存时机和注入上下文的大小。

#### Scenario: 预算初始化
- **WHEN** 会话开始时
- **THEN** 系统根据模型上下文窗口设置总预算
- **AND** 为 checkpoint、memory、task-progress、recent-messages 分配子预算

#### Scenario: 预算超限触发检查点
- **WHEN** 已使用 token 超过检查点阈值（如 60%）
- **THEN** 系统自动调用 checkpoint-writer 保存检查点
- **AND** 截断或归档旧消息

### Requirement: 自动检查点
The system SHALL 根据上下文使用比例自动决定检查点保存时机，而非仅按消息数量触发。

#### Scenario: 上下文接近上限
- **WHEN** 当前消息累计 token 超过配置阈值
- **THEN** 自动生成会话检查点
- **AND** 清空或归档超出预算的旧消息

### Requirement: 上下文重建
The system SHALL 在上下文接近上限时，从 checkpoint + 记忆 + 任务进展 + 近期消息重建有效上下文。

#### Scenario: 重建精简上下文
- **WHEN** 上下文接近模型上限
- **THEN** 保留最近的 N 条消息
- **AND** 注入最新 checkpoint
- **AND** 按相关性注入项目记忆和任务进展
- **AND** 丢弃过旧或低相关消息

### Requirement: 预算化注入
The system SHALL 按 token budget 控制 checkpoint / memory / notes 注入上下文的大小，并按重要性排序。

#### Scenario: 重要性排序注入
- **WHEN** 组装上下文时
- **THEN** 先注入 checkpoint（最高优先级）
- **AND** 再注入当前任务相关进展
- **AND** 最后注入相关性最高的记忆片段
- **AND** 每项严格控制在子预算内

### Requirement: 树状任务系统
The system SHALL 支持树状任务结构（T1, T1.1, T1.2…），并自动与检查点联动。

#### Scenario: 创建子任务
- **WHEN** agent 将任务拆分为子任务
- **THEN** 系统创建 T1.1、T1.2 等子任务节点
- **AND** 记录父任务引用
- **AND** 子任务进展自动汇总到父任务

#### Scenario: 任务与检查点联动
- **WHEN** 检查点保存时
- **THEN** 当前激活任务及其子任务状态被写入 checkpoint
- **AND** 会话恢复时可还原任务树状态

## MODIFIED Requirements
### Requirement: 检查点系统
The system SHALL 由仅按消息数量触发改为基于 token 预算和上下文窗口使用比例自动触发。

#### Scenario: 自适应检查点频率
- **WHEN** 会话较短且 token 使用低
- **THEN** 减少检查点生成频率
- **WHEN** 会话较长且接近上限
- **THEN** 增加检查点生成频率

### Requirement: 任务系统
The system SHALL 支持任务的父子关系，形成树状结构。

#### Scenario: 任务嵌套
- **WHEN** 创建任务时指定 parentTaskId
- **THEN** 新任务成为父任务的子节点
- **AND** 任务 ID 遵循 T{parentId}.{childIndex} 或类似规则

## REMOVED Requirements
无。
