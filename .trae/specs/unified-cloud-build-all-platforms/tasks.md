# Tasks

- [x] Task 1: 引入 Electron 桌面端框架
  - [x] SubTask 1.1: 安装 `electron`、`electron-builder` 为 devDependencies
  - [x] SubTask 1.2: 创建 `electron/main.ts`，加载前端 dist 产物，支持 `VITE_DIRECT_LLM=true` 直连模式
  - [x] SubTask 1.3: 创建 `electron/preload.ts`，暴露安全的 IPC 接口
  - [x] SubTask 1.4: 在 `package.json` 中添加 `build:desktop`、`build:win`、`build:mac`、`build:linux` 脚本
  - [x] SubTask 1.5: 配置 `electron-builder` 产物格式（nsis/dmg/AppImage）

- [x] Task 2: 桌面端配置持久化
  - [x] SubTask 2.1: 安装 `electron-store`，创建 `electron/config.ts` 管理桌面端配置
  - [x] SubTask 2.2: 在 Electron 主进程中将 config 注入到 `setEnvProvider`
  - [x] SubTask 2.3: 确保桌面端设置页面的配置保存后立即生效

- [x] Task 3: 彻底移除运行时环境变量依赖
  - [x] SubTask 3.1: 清理 `.env.example`，仅保留构建期 `VITE_*` 变量，移除所有运行时变量（`AI_GATEWAY_*`、`DSPARK_*`、`EDGEONE_*`）
  - [x] SubTask 3.2: 确保 `shared/` 模块不再依赖 `process.env` 作为运行时配置源
  - [x] SubTask 3.3: 确保 `src/main.tsx` 启动时正确注入 appConfig 到 configProvider

- [x] Task 4: 模块化架构文档
  - [x] SubTask 4.1: 创建 `docs/modules.md`，描述各模块职责、技术栈和接口
  - [x] SubTask 4.2: 梳理模块清单：前端（React/TS）、核心逻辑（shared/TS）、LLM 适配（shared/TS）、DSpark 适配（shared/TS）、桌面壳（Electron/TS）、Android 壳（Kotlin/Java）、iOS 壳（Swift）、鸿蒙壳（ArkTS）、构建脚本（Shell/JS）

- [x] Task 5: 云端 CI/CD 构建流水线
  - [x] SubTask 5.1: 创建 `.github/workflows/build-all.yml`，定义全平台构建矩阵
  - [x] SubTask 5.2: Web 构建 job：`npm run build`
  - [x] SubTask 5.3: Android 构建 job：`npm run build:android` + Gradle 打包
  - [x] SubTask 5.4: 桌面端构建 job（矩阵：windows/macOS/linux）：`npm run build:desktop` + electron-builder 打包
  - [x] SubTask 5.5: 鸿蒙构建 job：`npm run build:harmony`（产物归档）
  - [x] SubTask 5.6: 触发条件：push tag `v*` 或手动 dispatch
  - [x] SubTask 5.7: 产物上传到 GitHub Releases

- [x] Task 6: 更新 package.json 和文档
  - [x] SubTask 6.1: 确保 package.json 中所有构建脚本完整（web/Android/iOS/鸿蒙/桌面三平台）
  - [x] SubTask 6.2: 更新 README.md 和 README_zh-CN.md，添加桌面端使用说明和云端构建说明
  - [x] SubTask 6.3: 更新 `.gitignore`，排除 `android/`、`ios/`、`harmony/` 中的构建产物

- [x] Task 7: 构建与验证
  - [x] SubTask 7.1: 运行 `npx tsc --noEmit` 确认无类型错误
  - [x] SubTask 7.2: 运行 `npm run build` 确认 Web 构建成功
  - [x] SubTask 7.3: 运行 `npm run build:desktop` 确认 Electron 构建成功
  - [x] SubTask 7.4: 运行 `npm run build:android` 确认 Android 同步成功
  - [x] SubTask 7.5: 运行 `npm run build:harmony` 确认鸿蒙产物生成
  - [x] SubTask 7.6: 验证 `.env.example` 中无运行时变量

# Task Dependencies
- Task 2 依赖于 Task 1
- Task 3 可并行于 Task 2
- Task 4 可并行于 Task 3
- Task 5 依赖于 Task 1 和 Task 3
- Task 6 依赖于 Task 5
- Task 7 依赖于 Task 6
