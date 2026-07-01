# Checklist

- [ ] 已读取 `src/App.tsx`、`src/main.tsx`、`package.json`、`vite.config.ts` 并理解当前结构
- [ ] `CloudLandingPage.tsx` 组件已创建，包含账户登录/验证入口、产品 Demo 区、Git 克隆命令、打包下载按钮
- [ ] `CloudLandingPage.module.css` 样式文件已创建并正确引用
- [ ] `App.tsx` 已根据 `VITE_APP_MODE` 切换云端入口页与本地完整应用
- [ ] 本地模式默认行为与改动前一致
- [ ] `vite-env.d.ts` 已补充 `VITE_APP_MODE` 类型声明
- [ ] `package.json` 已添加 `build:cloud` 脚本
- [ ] `edgeone.json` 的 `buildCommand` 已更新为 `npm run build:cloud`
- [ ] `scripts/package-local.js` 已创建并可成功生成本地安装包
- [ ] `package.json` 已添加 `package:local` 脚本
- [ ] `README.md` 已更新，说明云端与本地两种使用方式
- [ ] `.env.example` 已添加 `VITE_APP_MODE` 说明
- [ ] `npm run build:cloud` 构建成功，产物仅包含云端入口页
- [ ] `npm run build` 构建成功，产物包含完整本地功能
- [ ] `npm run package:local` 构建成功，压缩包内容完整
