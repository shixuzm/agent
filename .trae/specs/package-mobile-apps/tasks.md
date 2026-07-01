# Tasks

- [x] Task 1: 调研当前项目结构与前端 API 调用方式
  - [x] SubTask 1.1: 读取 `package.json`，确认现有依赖与脚本
  - [x] SubTask 1.2: 读取 `src/api.ts`，了解前端如何调用后端接口
  - [x] SubTask 1.3: 读取 `shared/llm.ts`、`shared/dspark.ts`、`shared/store.ts`，了解 env 参数使用方式
  - [x] SubTask 1.4: 读取前端路由结构，确认设置页面插入位置

- [x] Task 2: 实现应用内配置模块
  - [x] SubTask 2.1: 创建 `src/lib/appConfig.ts`，提供 `getAppConfig()`、`setAppConfig()`、`hasAppConfig()`
  - [x] SubTask 2.2: 配置持久化到 `localStorage`，key 为 `app_settings`
  - [x] SubTask 2.3: 定义 `AppConfig` 类型：`aiGatewayApiKey`、`aiGatewayBaseUrl`、`aiGatewayModel`、`dsparkEndpoint`、`dsparkApiKey`、`dsparkDefaultCluster`

- [x] Task 3: 修改 shared 模块支持 appConfig
  - [x] SubTask 3.1: 修改 `shared/llm.ts` 的 `chatCompletion`，优先从 `appConfig` 读取配置，回退到 `env`
  - [x] SubTask 3.2: 修改 `shared/dspark.ts` 的 `createDSparkClient`，优先从 `appConfig` 读取配置，回退到 `env`
  - [x] SubTask 3.3: 修改 `shared/store.ts` 的 `getStore`，优先从 `appConfig` 读取配置
  - [x] SubTask 3.4: 确保在浏览器环境中 `appConfig` 可正常工作（不依赖 Node.js `process.env`）

- [x] Task 4: 新增前端设置页面
  - [x] SubTask 4.1: 创建 `src/pages/Settings.tsx`，包含 API Key、Base URL、Model、DSpark 配置表单
  - [x] SubTask 4.2: 实现保存逻辑，调用 `setAppConfig()` 写入 localStorage
  - [x] SubTask 4.3: 实现读取逻辑，页面加载时回显已保存配置
  - [x] SubTask 4.4: 在 App 路由中添加 `/settings` 路由
  - [x] SubTask 4.5: 在 UI 头部或侧边栏添加设置入口图标

- [x] Task 5: 实现首次启动引导
  - [x] SubTask 5.1: 在 App 启动时检查 `hasAppConfig()`
  - [x] SubTask 5.2: 若未配置，自动跳转到设置页面
  - [x] SubTask 5.3: 配置保存后跳转到主功能页面

- [x] Task 6: 前端直连 LLM 服务
  - [x] SubTask 6.1: 修改 `src/api.ts`，将聊天接口从调用后端 `/api/chat` 改为直接在前端调用 `chatCompletion`
  - [x] SubTask 6.2: 将 `shared/orchestrator.ts` 中的 `planAndExecute` 适配为前端可调用
  - [x] SubTask 6.3: 确保流式响应（SSE）在前端正常工作

- [x] Task 7: 引入 Capacitor 并配置 Android/iOS
  - [x] SubTask 7.1: 安装 `@capacitor/core`、`@capacitor/cli`、`@capacitor/android`、`@capacitor/ios`
  - [x] SubTask 7.2: 创建 `capacitor.config.ts`，配置 appId、appName、webDir
  - [x] SubTask 7.3: 运行 `npx cap add android` 和 `npx cap add ios`
  - [x] SubTask 7.4: 在 `package.json` 中添加 `build:android` 和 `build:ios` 脚本

- [x] Task 8: 配置鸿蒙平台
  - [x] SubTask 8.1: 创建 `harmony/` 目录结构，包含 ArkTS 入口和 WebView 组件
  - [x] SubTask 8.2: 编写鸿蒙 `EntryAbility.ets`，使用 Web组件加载前端 dist 产物
  - [x] SubTask 8.3: 创建 `harmony/build-profile.json5` 配置文件
  - [x] SubTask 8.4: 在 `package.json` 中添加 `build:harmony` 脚本
  - [x] SubTask 8.5: 创建 `scripts/build-harmony.js`，构建前端并复制到鸿蒙工程

- [x] Task 9: 更新文档
  - [x] SubTask 9.1: 更新 `README.md`，说明移动端下载安装和使用方式
  - [x] SubTask 9.2: 更新 `README_zh-CN.md`（如存在）
  - [x] SubTask 9.3: 说明三端构建命令：`build:android`、`build:ios`、`build:harmony`

- [x] Task 10: 构建与验证
  - [x] SubTask 10.1: 运行 `npx tsc --noEmit` 确认无类型错误
  - [x] SubTask 10.2: 运行 `npm run build` 确认前端构建成功
  - [x] SubTask 10.3: 运行 `npm run build:android` 确认 Capacitor 同步成功
  - [x] SubTask 10.4: 运行 `npm run build:harmony` 确认鸿蒙工程产物生成

# Task Dependencies
- Task 2 依赖于 Task 1
- Task 3 依赖于 Task 2
- Task 4 依赖于 Task 2
- Task 5 依赖于 Task 4
- Task 6 依赖于 Task 3
- Task 7 依赖于 Task 6
- Task 8 可并行于 Task 7（鸿蒙不依赖 Capacitor）
- Task 9 可并行于 Task 8
- Task 10 依赖于 Task 7、Task 8、Task 9
