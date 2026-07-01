# Tasks

- [ ] Task 1: 调研当前 Capacitor / 移动端打包方案与项目结构
  - [ ] SubTask 1.1: 读取 `package.json`，确认当前依赖、脚本和前端技术栈
  - [ ] SubTask 1.2: 读取 `vite.config.ts`、`tsconfig.json`、前端路由配置
  - [ ] SubTask 1.3: 确认后端服务形态（云端函数 / 本地服务 / 纯前端调用）
  - [ ] SubTask 1.4: 确认当前 API 调用方式（直接 fetch 到网关 / 通过后端代理）

- [ ] Task 2: 添加 Capacitor 依赖与基础配置
  - [ ] SubTask 2.1: 安装 `@capacitor/core`、`@capacitor/cli`、`@capacitor/android`、`@capacitor/ios`、`@capacitor/preferences`
  - [ ] SubTask 2.2: 创建 `capacitor.config.ts`，配置 appId、appName、webDir
  - [ ] SubTask 2.3: 更新 `package.json` 添加 `mobile:sync`、`mobile:build:android`、`mobile:build:ios` 脚本
  - [ ] SubTask 2.4: 初始化 `android/` 和 `ios/` 平台工程

- [ ] Task 3: 实现应用内设置页面与本地存储
  - [ ] SubTask 3.1: 创建 `src/pages/Settings.tsx`，包含 API Key、Base URL、Model、DSpark Endpoint 等表单
  - [ ] SubTask 3.2: 添加设置页面路由
  - [ ] SubTask 3.3: 使用 `@capacitor/preferences` 实现配置读写
  - [ ] SubTask 3.4: 在移动端 UI 中添加设置入口

- [ ] Task 4: 调整前端 API 调用读取运行时配置
  - [ ] SubTask 4.1: 创建 `src/lib/settings.ts`，统一封装配置读取
  - [ ] SubTask 4.2: 修改前端 API 调用处，从配置中读取 baseUrl / apiKey / model
  - [ ] SubTask 4.3: 确保配置不存在时提示用户进入设置

- [ ] Task 5: 鸿蒙应用最小工程
  - [ ] SubTask 5.1: 创建 `harmony/` 目录，包含基于鸿蒙 WebView 的最小 EntryAbility
  - [ ] SubTask 5.2: 鸿蒙 WebView 加载 `index.html` 本地资源
  - [ ] SubTask 5.3: 鸿蒙端使用 LocalStorage 持久化配置（与前端约定相同 key）
  - [ ] SubTask 5.4: 提供鸿蒙构建说明文档

- [ ] Task 6: 打包脚本
  - [ ] SubTask 6.1: 创建 `scripts/package-mobile.js`，串联 `vite build`、`cap sync`、Android / iOS 构建命令
  - [ ] SubTask 6.2: 在 `package.json` 中注册 `package:mobile` 脚本
  - [ ] SubTask 6.3: 脚本输出产物路径说明

- [ ] Task 7: 更新文档
  - [ ] SubTask 7.1: 更新 `README.md`，说明移动端安装包（APK / IPA / HAP）下载和设置方式
  - [ ] SubTask 7.2: 更新 `README_zh-CN.md`（如存在）
  - [ ] SubTask 7.3: 弱化 `.env` 配置说明，强调应用内设置

- [ ] Task 8: 构建与验证
  - [ ] SubTask 8.1: 运行 `npx tsc --noEmit` 确认无类型错误
  - [ ] SubTask 8.2: 运行 `npm run build` 确认前端构建成功
  - [ ] SubTask 8.3: 运行 `npm run mobile:sync` 确认 Capacitor 同步成功
  - [ ] SubTask 8.4: 在环境允许时运行 Android / iOS / 鸿蒙构建，确认产物生成

# Task Dependencies
- Task 2 依赖于 Task 1
- Task 3 依赖于 Task 2
- Task 4 依赖于 Task 3
- Task 5 可并行于 Task 4
- Task 6 依赖于 Task 2 和 Task 5
- Task 7 可并行于 Task 6
- Task 8 依赖于 Task 6 和 Task 7
