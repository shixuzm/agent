# Checklist

- [ ] 已调研 `shared/dspark.ts`、`shared/skills.ts`、`shared/store.ts`、`.env.example` 并确认 MNN 可用形态
- [ ] `shared/mnn.ts` 已创建，包含 `createMNNSession`、`runInference`、配置校验与错误处理
- [ ] Web/浏览器环境无法加载 MNN 时返回 graceful 降级信息
- [ ] `shared/skills.ts` 中已删除 `dspark` handler 并新增 `mnn` handler
- [ ] `skill_mnn` 已在 `shared/store.ts` 中注册并替换 `skill_dspark`
- [ ] `agent_super` 的技能绑定已从 `skill_dspark` 替换为 `skill_mnn`
- [ ] 项目中已无对 `shared/dspark.ts` 的引用
- [ ] `.env.example` 已移除 DSpark 配置并添加 MNN 配置说明
- [ ] `README.md` 已更新为 MNN 端侧推理说明
- [ ] `npx tsc --noEmit` 无类型错误
- [ ] `npm run build` 构建成功
- [ ] `npm run build:cloud` 构建成功
- [ ] `npm run build:desktop` 桌面端构建成功
