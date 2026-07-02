# 将 DSpark 替换为 MNN Spec

## Why
当前项目集成的 DSpark 是服务端推理加速框架，需要外部服务和网络调用，部署和维护成本较高。为了支持应用内端侧推理加速、降低延迟并提升隐私性，需要将底层推理加速框架从 DSpark 迁移到端侧框架 MNN。

## What Changes
- 移除 `shared/dspark.ts` 及相关 DSpark 适配代码。
- 新增 MNN 端侧推理适配模块 `shared/mnn.ts`，完全内置默认配置，无需环境变量。
- 将 `shared/skills.ts` 中的 `dspark` skill handler 替换为 `mnn` handler。
- 在 `shared/store.ts` 中将 `skill_dspark` 替换为 `skill_mnn`，并调整 `agent_super` 的技能绑定。
- 从 `.env.example` 中移除 DSpark 和 MNN 相关环境变量配置。
- 更新 `README.md`，说明 MNN 端侧推理能力、内置默认配置与平台限制。
- **BREAKING**: 移除对 `DSPARK_ENDPOINT` 等环境变量的依赖；MNN 默认内置配置，无需用户配置。

## Impact
- Affected specs: 技能体系、智能体能力、环境配置、项目文档、端侧推理能力。
- Affected code: `shared/dspark.ts`（删除）、`shared/mnn.ts`（新增）、`shared/skills.ts`、`shared/store.ts`、`.env.example`、`README.md`。

## ADDED Requirements
### Requirement: MNN 端侧推理适配模块
The system SHALL 提供一个 MNN 适配模块，封装端侧模型加载、输入预处理、推理执行、结果后处理；模块完全内置默认配置，不依赖任何环境变量。

#### Scenario: 初始化 MNN 推理会话
- **WHEN** 技能被调用或会话首次需要端侧推理
- **THEN** 根据平台（Node.js / Electron / 浏览器）加载合适的 MNN 后端
- **AND** 使用内置默认模型路径/配置创建并缓存 MNN 推理会话

#### Scenario: 执行端侧推理
- **WHEN** 调用 `runInference(inputTensor, options)`
- **THEN** 对输入进行预处理
- **AND** 调用 MNN 执行推理
- **AND** 对输出进行后处理并返回

#### Scenario: 无环境变量配置
- **WHEN** 用户未设置任何 MNN 环境变量
- **THEN** MNN 模块仍可使用内置默认值初始化
- **AND** 仅在模型文件缺失或平台不支持时给出明确提示

### Requirement: MNN 技能
The system SHALL 提供 `skill_mnn` 技能，允许智能体通过自然语言调用端侧 MNN 推理。

#### Scenario: 智能体调用 MNN 技能
- **WHEN** 用户请求"运行本地模型推理"或"用端侧模型分析数据"
- **THEN** 智能体调用 `skill_mnn`
- **AND** 将输入数据提交给本地 MNN 会话
- **AND** 将推理结果返回给用户

## MODIFIED Requirements
### Requirement: 技能注册与智能体绑定
The system SHALL 在 `shared/store.ts` 中用 `skill_mnn` 替换 `skill_dspark`，并允许在创建/编辑智能体时选择 MNN 技能。

#### Scenario: 为智能体启用 MNN
- **WHEN** 用户在 AgentsPanel 中为某个智能体勾选 MNN 技能
- **THEN** 该智能体的 `skillIds` 包含 `skill_mnn`
- **AND** 运行时可通过 `executeSkill` 调用 MNN 端侧推理

## REMOVED Requirements
### Requirement: DSpark 适配与技能
**Reason**: 项目策略从服务端推理加速转为端侧推理加速，DSpark 不再适用。
**Migration**: 删除 `shared/dspark.ts` 和 `skill_dspark`；如有外部 Spark 任务需求，可通过通用代码执行 skill 或外部 API 手动实现。
