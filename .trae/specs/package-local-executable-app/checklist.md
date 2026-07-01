# Checklist

- [ ] 已调研当前 Electron / 桌面打包技术栈与项目结构
- [ ] `electron`、`electron-builder` 已安装并配置
- [ ] `electron/main.ts` 已创建，可启动本地后端服务并加载前端页面
- [ ] `electron/preload.ts` 已创建，暴露安全的 `window.electronAPI`
- [ ] `electron/config.ts` 已实现本地配置持久化
- [ ] `shared/llm.ts` 和 `shared/dspark.ts` 支持从传入 `env` 读取配置
- [ ] 后端 `/api/settings` 接口可读取和更新配置
- [ ] 前端 `Settings.tsx` 设置页面已创建并添加到路由
- [ ] UI 中已添加设置入口
- [ ] Electron 主进程已集成后端服务
- [ ] `scripts/package-desktop.js` 打包脚本已创建
- [ ] `npm run package:desktop` 可生成桌面可执行程序
- [ ] `README.md` 已更新为桌面应用使用说明
- [ ] `npx tsc --noEmit` 无类型错误
- [ ] `npm run build` 构建成功
