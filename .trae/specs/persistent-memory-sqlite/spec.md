# 持久化记忆（本地）Spec

## Why
当前智能体每次新会话都需要重新理解项目背景，无法跨会话继承项目知识、架构决策、任务进展和临时笔记。通过基于 SQLite FTS5 的本地持久化记忆，让 agent 在会话恢复时自动注入上下文，实现真正连续的协作体验。

## What Changes
- 新增基于 SQLite FTS5 的本地记忆存储模块，支持跨会话全文检索。
- 引入 5 类记忆实体：项目记忆 `MEMORY.md`、会话检查点 `checkpoint.md`、笔记暂存 `notes.md`、任务进展 `tasks/<id>/progress.md`、以及可被检索的元数据索引。
- 新增 `checkpoint-writer` 子智能体，自动维护会话检查点 `checkpoint.md`。
- 在会话恢复/启动时自动从 SQLite 读取相关记忆并注入上下文。
- 新增设置页面入口，允许用户查看和管理本地记忆（只读清理，不强制编辑）。

## Impact
- Affected specs: 智能体上下文管理、记忆持久化、SQLite 存储、子智能体、设置页面扩展。
- Affected code: `shared/memory/`（新增）、`shared/store.ts`、`shared/orchestrator.ts`、`agents/chat/index.ts`、Settings 面板、package.json。

## ADDED Requirements
### Requirement: SQLite FTS5 记忆存储
The system SHALL 使用 SQLite 在本地持久化存储项目记忆、检查点、笔记和任务进展，并提供全文搜索能力。

#### Scenario: 写入记忆
- **WHEN** agent 产生新的项目知识或架构决策
- **THEN** 系统将内容写入 SQLite 记忆表
- **AND** FTS5 索引立即可用于搜索

#### Scenario: 搜索记忆
- **WHEN** 会话启动或用户提问涉及项目背景
- **THEN** 系统使用 FTS5 搜索最相关的记忆片段
- **AND** 自动注入到当前上下文中

### Requirement: 项目记忆 MEMORY.md
The system SHALL 维护 `MEMORY.md` 作为项目级跨会话知识库。

#### Scenario: 跨会话继承项目规则
- **WHEN** 用户打开新会话
- **THEN** MEMORY.md 中的项目规则、架构决策、关键约定自动进入上下文
- **AND** agent 无需重新询问这些背景

### Requirement: 会话检查点 checkpoint.md
The system SHALL 通过 `checkpoint-writer` 子智能体自动维护 `checkpoint.md` 会话检查点。

#### Scenario: 自动生成检查点
- **WHEN** 会话中发生重要进展（如完成子任务、做出架构决定、用户确认方案）
- **THEN** checkpoint-writer 子智能体更新 checkpoint.md
- **AND** 新会话恢复时读取最新检查点作为初始状态

### Requirement: 笔记暂存 notes.md
The system SHALL 提供 `notes.md` 作为 agent 临时记录区。

#### Scenario: 临时记录待确认信息
- **WHEN** agent 在会话中发现需要后续跟进的信息
- **THEN** agent 将要点写入 notes.md
- **AND** 后续会话可通过搜索或列表访问这些暂存笔记

### Requirement: 任务进展 tasks/<id>/progress.md
The system SHALL 为每个任务维护独立的 `progress.md` 日志。

#### Scenario: 追踪多任务状态
- **WHEN** 用户创建或分配任务给 agent
- **THEN** 系统创建 `tasks/<id>/progress.md`
- **AND** 每次进展更新追加到对应日志
- **AND** 会话恢复时按任务 ID 读取相关进展

### Requirement: 会话恢复自动注入记忆
The system SHALL 在会话恢复时自动将相关记忆注入上下文。

#### Scenario: 继续之前的工作
- **WHEN** 用户重新打开应用并进入某个会话
- **THEN** 系统自动加载该会话的检查点、项目记忆、相关任务进展
- **AND** 注入到 system prompt 或 messages 中

### Requirement: 记忆管理界面
The system SHALL 在设置页面提供记忆管理入口。

#### Scenario: 用户查看本地记忆
- **WHEN** 用户打开设置 → 记忆管理
- **THEN** 显示记忆条数、占用空间、最近更新
- **AND** 允许清空所有记忆（需二次确认）

## MODIFIED Requirements
### Requirement: 智能体上下文组装
The system SHALL 在原有上下文基础上，加入来自 SQLite 记忆的相关片段。

#### Scenario: 上下文注入
- **WHEN** orchestrator 组装要发送给 LLM 的消息
- **THEN** 优先加入当前会话 checkpoint
- **AND** 根据用户最新问题用 FTS5 检索 MEMORY.md / notes / tasks 中 top-k 相关片段
- **AND** 按固定格式拼接到 system prompt

## REMOVED Requirements
无。
