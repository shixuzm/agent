# Checklist

- [x] 已调研 `shared/skills.ts`、`shared/store.ts`、`.env.example` 并确认 DSpark 接入形式
- [x] `shared/dspark.ts` 已创建，包含 `createDSparkClient`、`submitJob`、`getJobStatus`、`getJobResult`
- [x] DSpark 配置缺失时给出明确错误提示
- [x] `shared/skills.ts` 中已新增 `dspark` handler，支持 submit/status/result
- [x] `skill_dspark` 已在 `shared/store.ts` 中注册
- [x] 主智能体 `agent_super` 已绑定 `skill_dspark`
- [x] `.env.example` 已添加 DSpark 相关配置说明
- [x] `README.md` 已添加 DSpark 使用说明
- [x] `npx tsc --noEmit` 无类型错误
- [x] `npm run build` 构建成功
- [x] `npm run build:cloud` 构建成功
