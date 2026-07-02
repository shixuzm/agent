# Tasks

- [ ] Task 1: 调研现有 DSpark 集成与 MNN 可用方案
  - [ ] SubTask 1.1: 读取 `shared/dspark.ts`，记录所有导出和接口
  - [ ] SubTask 1.2: 读取 `shared/skills.ts`，确认 `dspark` handler 实现与调用方式
  - [ ] SubTask 1.3: 读取 `shared/store.ts`，确认 `skill_dspark` 和 `agent_super` 绑定
  - [ ] SubTask 1.4: 确认 MNN 在当前运行环境（Node.js / Electron / 浏览器）的可用形态（npm 包、原生模块、WASM）
  - [ ] SubTask 1.5: 读取 `.env.example`，记录现有 DSpark 配置项

- [ ] Task 2: 实现 MNN 适配模块
  - [ ] SubTask 2.1: 创建 `shared/mnn.ts`，定义 MNNConfig / MNNInferenceResult / MNNError 类型
  - [ ] SubTask 2.2: 实现 `createMNNSession(env)` 工厂函数，支持缓存和配置缺失报错
  - [ ] SubTask 2.3: 实现 `runInference(input, options)`，包含预处理、推理占位、后处理
  - [ ] SubTask 2.4: 对缺失配置给出明确错误提示
  - [ ] SubTask 2.5: 在浏览器/Web 环境无法加载 MNN 时返回 graceful 降级信息

- [ ] Task 3: 将 DSpark skill 替换为 MNN skill
  - [ ] SubTask 3.1: 在 `shared/skills.ts` 中删除 `dspark` handler
  - [ ] SubTask 3.2: 新增 `mnn` handler，支持 action: 'infer'
  - [ ] SubTask 3.3: 调用 `shared/mnn.ts` 中封装的方法
  - [ ] SubTask 3.4: 为 skill 编写 inputSchema / outputSchema

- [ ] Task 4: 注册 MNN 技能并替换智能体绑定
  - [ ] SubTask 4.1: 在 `shared/store.ts` 的 `seedBuiltIns()` 中用 `skill_mnn` 替换 `skill_dspark`
  - [ ] SubTask 4.2: 将 `agent_super` 的 skillIds 中 `skill_dspark` 替换为 `skill_mnn`
  - [ ] SubTask 4.3: 删除所有引用 `shared/dspark.ts` 的代码和类型

- [ ] Task 5: 更新环境变量说明
  - [ ] SubTask 5.1: 在 `.env.example` 中移除 `DSPARK_ENDPOINT`、`DSPARK_API_KEY`、`DSPARK_DEFAULT_CLUSTER`
  - [ ] SubTask 5.2: 在 `.env.example` 中添加 `MNN_MODEL_PATH`、`MNN_BACKEND`、`MNN_INPUT_SHAPE` 等说明
  - [ ] SubTask 5.3: 在 `README.md` 中更新为 MNN 端侧推理配置与使用说明

- [ ] Task 6: 构建与验证
  - [ ] SubTask 6.1: 运行 `npx tsc --noEmit` 确认无类型错误
  - [ ] SubTask 6.2: 运行 `npm run build` 确认本地构建成功
  - [ ] SubTask 6.3: 运行 `npm run build:cloud` 确认云端构建成功
  - [ ] SubTask 6.4: 运行 `npm run build:desktop` 确认桌面端构建成功

# Task Dependencies
- Task 2 依赖于 Task 1
- Task 3 依赖于 Task 2
- Task 4 依赖于 Task 3
- Task 5 可并行于 Task 4
- Task 6 依赖于 Task 4 和 Task 5
