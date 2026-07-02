# Checklist

- [x] 已调研 `shared/dspark.ts`、`shared/skills.ts`、`shared/store.ts`、`.env.example` 并确认 MNN 可用形态
- [x] `shared/mnn.ts` 已创建，包含 `createMNNSession`、`runInference`，完全内置默认配置
- [x] Web/浏览器环境无法加载 MNN 时返回 graceful 降级信息
- [x] `shared/skills.ts` 中已删除 `dspark` handler 并新增 `mnn` handler
- [x] `skill_mnn` 已在 `shared/store.ts` 中注册并替换 `skill_dspark`
- [x] `agent_super` 的技能绑定已从 `skill_dspark` 替换为 `skill_mnn`
- [x] 项目中已无对 `shared/dspark.ts` 的引用
- [x] `.env.example` 已移除 DSpark 配置且无 MNN 环境变量
- [x] `README.md` 已更新为 MNN 零配置端侧推理说明
- [x] `npx tsc --noEmit` 无类型错误
- [x] `npm run build` 构建成功
- [x] `npm run build:cloud` 构建成功
- [x] `npm run build:desktop` 桌面端构建成功
