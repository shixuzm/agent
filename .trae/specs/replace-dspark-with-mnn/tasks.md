# Tasks

- [x] Task 1: 调研现有 DSpark 集成与 MNN 可用方案
  - [x] SubTask 1.1: 读取 `shared/dspark.ts`，记录所有导出和接口
  - [x] SubTask 1.2: 读取 `shared/skills.ts`，确认 `dspark` handler 实现与调用方式
  - [x] SubTask 1.3: 读取 `shared/store.ts`，确认 `skill_dspark` 和 `agent_super` 绑定
  - [x] SubTask 1.4: 确认 MNN 在当前运行环境（Node.js / Electron / 浏览器）的可用形态（npm 包、原生模块、WASM）
  - [x] SubTask 1.5: 读取 `.env.example`，记录现有 DSpark 配置项

- [x] Task 2: 实现 MNN 适配模块（零环境变量配置）
  - [x] SubTask 2.1: 创建 `shared/mnn.ts`，定义 MNNConfig / MNNInferenceResult / MNNError 类型
  - [x] SubTask 2.2: 在 `shared/mnn.ts` 中内置默认模型路径、后端、输入形状等常量
  - [x] SubTask 2.3: 实现 `createMNNSession(options?)` 工厂函数，不依赖 env，支持缓存
  - [x] SubTask 2.4: 实现 `runInference(input, options)`，包含预处理、推理占位、后处理
  - [x] SubTask 2.5: 在浏览器/Web 环境无法加载 MNN 时返回 graceful 降级信息
  - [x] SubTask 2.6: 对模型文件缺失或平台不支持给出明确错误提示

- [x] Task 3: 将 DSpark skill 替换为 MNN skill
  - [x] SubTask 3.1: 在 `shared/skills.ts` 中删除 `dspark` handler
  - [x] SubTask 3.2: 新增 `mnn` handler，支持 action: 'infer'
  - [x] SubTask 3.3: 调用 `shared/mnn.ts` 中封装的方法
  - [x] SubTask 3.4: 为 skill 编写 inputSchema / outputSchema

- [x] Task 4: 注册 MNN 技能并替换智能体绑定
  - [x] SubTask 4.1: 在 `shared/store.ts` 的 `seedBuiltIns()` 中用 `skill_mnn` 替换 `skill_dspark`
  - [x] SubTask 4.2: 将 `agent_super` 的 skillIds 中 `skill_dspark` 替换为 `skill_mnn`
  - [x] SubTask 4.3: 删除所有引用 `shared/dspark.ts` 的代码和类型

- [x] Task 5: 清理环境变量并更新文档
  - [x] SubTask 5.1: 在 `.env.example` 中移除 `DSPARK_ENDPOINT`、`DSPARK_API_KEY`、`DSPARK_DEFAULT_CLUSTER`
  - [x] SubTask 5.2: 确认 `.env.example` 中不再出现 MNN 环境变量
  - [x] SubTask 5.3: 在 `README.md` 中更新为 MNN 端侧推理说明，强调零配置

- [x] Task 6: 构建与验证
  - [x] SubTask 6.1: 运行 `npx tsc --noEmit` 确认无类型错误
  - [x] SubTask 6.2: 运行 `npm run build` 确认本地构建成功
  - [x] SubTask 6.3: 运行 `npm run build:cloud` 确认云端构建成功
  - [x] SubTask 6.4: 运行 `npm run build:desktop` 确认桌面端构建成功

# Task Dependencies
- Task 2 依赖于 Task 1
- Task 3 依赖于 Task 2
- Task 4 依赖于 Task 3
- Task 5 可并行于 Task 4
- Task 6 依赖于 Task 4 和 Task 5
