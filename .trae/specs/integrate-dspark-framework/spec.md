# 接入 DSpark 框架 Spec

## Why
为增强智能体在数据分析、批处理、ETL 等场景下的能力，项目需要接入 DSpark 框架。通过统一的适配层和技能封装，智能体可以在对话中直接调用 DSpark 完成数据计算任务。

## What Changes
- 新增 DSpark 适配模块 `shared/dspark.ts`，封装框架初始化、任务提交、结果获取等核心操作。
- 新增 `skill_dspark` 技能，使智能体可以通过自然语言调用 DSpark 执行数据任务。
- 在 `shared/store.ts` 中注册 DSpark 技能，并为主智能体可选绑定该技能。
- 更新 `.env.example`，添加 DSpark 相关配置项说明。
- 更新 `README.md`，说明 DSpark 接入后的使用方式与配置要求。

## Impact
- Affected specs: 技能体系、智能体能力、环境配置、项目文档。
- Affected code: `shared/dspark.ts`（新增）、`shared/skills.ts`、`shared/store.ts`、`.env.example`、`README.md`。

## ADDED Requirements
### Requirement: DSpark 适配模块
The system SHALL 提供一个 DSpark 适配模块，封装框架连接、任务提交、状态查询、结果读取等操作。

#### Scenario: 初始化 DSpark 客户端
- **WHEN** 系统读取到 `DSPARK_ENDPOINT` 等环境变量
- **THEN** 创建并缓存 DSpark 客户端
- **AND** 提供 `submitJob`、`getJobStatus`、`getJobResult` 方法

#### Scenario: 提交 DSpark 任务
- **WHEN** 调用 `submitJob(sqlOrScript, options)`
- **THEN** 向 DSpark 服务提交任务
- **AND** 返回任务 ID 或执行结果

### Requirement: DSpark 技能
The system SHALL 提供 `skill_dspark` 技能，允许智能体通过自然语言调用 DSpark。

#### Scenario: 智能体调用 DSpark 技能
- **WHEN** 用户请求"分析这张表的统计数据"或"执行这段 Spark SQL"
- **THEN** 智能体调用 `skill_dspark`
- **AND** 将用户的 SQL 或脚本提交给 DSpark
- **AND** 将执行结果返回给用户

## MODIFIED Requirements
### Requirement: 技能注册与智能体绑定
The system SHALL 在 `shared/store.ts` 中注册 `skill_dspark`，并允许在创建/编辑智能体时选择该技能。

#### Scenario: 为智能体启用 DSpark
- **WHEN** 用户在 AgentsPanel 中为某个智能体勾选 DSpark 技能
- **THEN** 该智能体的 `skillIds` 包含 `skill_dspark`
- **AND** 运行时可通过 `executeSkill` 调用 DSpark

## REMOVED Requirements
无。
