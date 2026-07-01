# Tasks

- [x] Task 1: 读取当前前端入口与路由结构
  - [x] SubTask 1.1: 读取 `src/App.tsx` 与 `src/main.tsx`，了解当前路由与渲染逻辑
  - [x] SubTask 1.2: 读取 `package.json` 脚本与依赖，确认构建命令
  - [x] SubTask 1.3: 读取 `vite.config.ts`，了解构建配置入口

- [x] Task 2: 实现统一登录/账户验证组件
  - [x] SubTask 2.1: 创建 `src/components/AuthGuard.tsx`，检测登录态，未登录时渲染登录界面
  - [x] SubTask 2.2: 创建 `src/components/LoginPage.tsx` 登录界面组件及样式
  - [x] SubTask 2.3: 使用本地存储（如 localStorage）或云端认证接口保存登录态

- [x] Task 3: 实现云端模式入口页组件
  - [x] SubTask 3.1: 创建 `src/components/CloudLandingPage.tsx` 组件，登录后展示产品 Demo 区、Git 克隆命令、打包下载按钮
  - [x] SubTask 3.2: 创建 `src/components/CloudLandingPage.module.css` 样式文件
  - [x] SubTask 3.3: 在组件中使用环境变量读取仓库地址与打包下载链接

- [x] Task 4: 实现应用模式切换逻辑
  - [x] SubTask 4.1: 在 `src/App.tsx` 中先经过 `AuthGuard` 验证登录态
  - [x] SubTask 4.2: 登录后根据 `import.meta.env.VITE_APP_MODE` 渲染云端入口页或本地完整应用
  - [x] SubTask 4.3: 确保本地模式默认展示完整功能，行为与当前一致
  - [x] SubTask 4.4: 在 `vite-env.d.ts` 中补充 `VITE_APP_MODE` 类型声明

- [x] Task 5: 配置云端与本地构建脚本
  - [x] SubTask 5.1: 在 `package.json` 中添加 `build:cloud` 脚本（设置 `VITE_APP_MODE=cloud`）
  - [x] SubTask 5.2: 保留默认 `build` 脚本为本地模式
  - [x] SubTask 5.3: 更新 `edgeone.json` 的 `buildCommand`，云端部署使用 `npm run build:cloud`

- [x] Task 6: 实现自动打包脚本
  - [x] SubTask 6.1: 创建 `scripts/package-local.js`，将源码、README、.env.example、package.json 等打包成 zip
  - [x] SubTask 6.2: 在 `package.json` 中添加 `package:local` 脚本
  - [x] SubTask 6.3: 运行脚本验证压缩包生成成功

- [x] Task 7: 更新文档说明
  - [x] SubTask 7.1: 更新 `README.md`，说明云端（账户验证 + Demo + 下载）与本地（完整功能）两种使用方式
  - [x] SubTask 7.2: 更新 `.env.example`，添加 `VITE_APP_MODE` 说明
  - [x] SubTask 7.3: 更新 `README_zh-CN.md`（如存在）

- [x] Task 8: 构建与验证
  - [x] SubTask 8.1: 运行 `npm run build:cloud`，确认云端产物包含登录页和 Demo/下载页
  - [x] SubTask 8.2: 运行 `npm run build`，确认本地产物包含登录页和完整功能
  - [x] SubTask 8.3: 运行 `npm run package:local`，确认压缩包生成

- [x] Task 9: 修复云端构建产物未剔除本地功能代码的问题
  - [x] SubTask 9.1: 将 `AppInner` 拆分到独立文件 `/workspace/src/AppInner.tsx`
  - [x] SubTask 9.2: 在 `App.tsx` 中通过动态 import 或条件渲染加载 `AppInner`，使 cloud 构建能 tree-shake 掉本地功能代码
  - [x] SubTask 9.3: 重新运行 `npm run build:cloud` 和 `npm run build`，验证产物大小和内容差异

- [x] Task 10: 重新验证 checklist 中未通过的构建项
  - [x] SubTask 10.1: 确认 `npm run build:cloud` 产物不再包含大量聊天功能代码
  - [x] SubTask 10.2: 确认 `npm run build` 产物包含完整本地功能
  - [x] SubTask 10.3: 更新 checklist 勾选状态

# Task Dependencies
- Task 2 依赖于 Task 1
- Task 3 依赖于 Task 2
- Task 4 依赖于 Task 1、Task 2 和 Task 3
- Task 5 依赖于 Task 4
- Task 6 可并行于 Task 5
- Task 7 依赖于 Task 4 和 Task 6
- Task 8 依赖于 Task 5、Task 6、Task 7
- Task 9 依赖于 Task 8
- Task 10 依赖于 Task 9
