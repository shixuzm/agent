# Checklist

- [x] 已读取 `src/App.tsx`、`src/main.tsx`、`package.json`、`vite.config.ts` 并理解当前结构
- [x] `AuthGuard.tsx` 已创建，能检测登录态并拦截未登录访问
- [x] `LoginPage.tsx` 登录界面已创建，样式正确
- [x] 登录态持久化机制已实现（localStorage 或云端认证接口）
- [x] `CloudLandingPage.tsx` 组件已创建，登录后展示产品 Demo 区、Git 克隆命令、打包下载按钮
- [x] `CloudLandingPage.module.css` 样式文件已创建并正确引用
- [x] `App.tsx` 已先经过 `AuthGuard`，登录后再根据 `VITE_APP_MODE` 切换云端入口页与本地完整应用
- [x] 本地模式登录后默认行为与改动前一致
- [x] `vite-env.d.ts` 已补充 `VITE_APP_MODE` 类型声明
- [x] `package.json` 已添加 `build:cloud` 脚本
- [x] `edgeone.json` 的 `buildCommand` 已更新为 `npm run build:cloud`
- [x] `scripts/package-local.js` 已创建并可成功生成本地安装包
- [x] `package.json` 已添加 `package:local` 脚本
- [x] `README.md` 已更新，说明云端与本地两种使用方式
- [x] `.env.example` 已添加 `VITE_APP_MODE` 说明
- [x] `npm run build:cloud` 构建成功，产物包含登录页和 Demo/下载页
- [x] `npm run build` 构建成功，产物包含登录页和完整本地功能
- [x] `npm run package:local` 构建成功，压缩包内容完整
