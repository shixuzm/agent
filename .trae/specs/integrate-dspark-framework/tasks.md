# Tasks

- [x] Task 1: 调研现有技能体系与 DSpark 可用接口
  - [x] SubTask 1.1: 读取 `shared/skills.ts`，了解 skill handler 的签名与执行方式
  - [x] SubTask 1.2: 读取 `shared/store.ts`，了解内置技能注册方式
  - [x] SubTask 1.3: 确认 DSpark 框架的接入形式（npm 包、REST API、本地 SDK 等）
  - [x] SubTask 1.4: 读取 `.env.example`，了解现有环境变量风格

- [x] Task 2: 创建 DSpark 适配模块
  - [x] SubTask 2.1: 创建 `shared/dspark.ts`，定义 DSparkClient 类型与配置
  - [x] SubTask 2.2: 实现 `createDSparkClient(env)` 工厂函数
  - [x] SubTask 2.3: 实现 `submitJob`、`getJobStatus`、`getJobResult` 最小可用方法
  - [x] SubTask 2.4: 对缺失配置给出明确错误提示

- [x] Task 3: 实现 DSpark 技能
  - [x] SubTask 3.1: 在 `shared/skills.ts` 中新增 `dspark` handler
  - [x] SubTask 3.2: 支持 `action: 'submit' | 'status' | 'result'`
  - [x] SubTask 3.3: 调用 `shared/dspark.ts` 中封装的方法
  - [x] SubTask 3.4: 为 skill 编写 inputSchema/outputSchema

- [x] Task 4: 注册 DSpark 技能与示例智能体
  - [x] SubTask 4.1: 在 `shared/store.ts` 的 `seedBuiltIns()` 中注册 `skill_dspark`
  - [x] SubTask 4.2: 为主智能体 `agent_super` 可选绑定 `skill_dspark`
  - [x] SubTask 4.3: 创建一个示例数据分析智能体（可选）

- [x] Task 5: 更新环境变量说明
  - [x] SubTask 5.1: 在 `.env.example` 中添加 `DSPARK_ENDPOINT`、`DSPARK_API_KEY`、`DSPARK_DEFAULT_CLUSTER` 等说明
  - [x] SubTask 5.2: 在 `README.md` 中添加 DSpark 配置与使用说明

- [x] Task 6: 构建与验证
  - [x] SubTask 6.1: 运行 `npx tsc --noEmit` 确认无类型错误
  - [x] SubTask 6.2: 运行 `npm run build` 确认本地构建成功
  - [x] SubTask 6.3: 运行 `npm run build:cloud` 确认云端构建成功

# Task Dependencies
- Task 2 依赖于 Task 1
- Task 3 依赖于 Task 2
- Task 4 依赖于 Task 3
- Task 5 可并行于 Task 4
- Task 6 依赖于 Task 4 和 Task 5
