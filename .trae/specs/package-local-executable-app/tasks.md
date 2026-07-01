# Tasks

- [ ] Task 1: 调研当前 Electron / 桌面打包技术栈与项目结构
  - [ ] SubTask 1.1: 读取 `package.json`，确认当前依赖和脚本
  - [ ] SubTask 1.2: 读取 `vite.config.ts` 和 `tsconfig.json`
  - [ ] SubTask 1.3: 调研当前后端服务入口（`agents/` 或 `cloud-functions/`）
  - [ ] SubTask 1.4: 确认前端路由与设置页面入口位置

- [ ] Task 2: 添加 Electron 依赖与基础配置
  - [ ] SubTask 2.1: 安装 `electron`、`electron-builder` 作为 devDependencies
  - [ ] SubTask 2.2: 创建 `electron/main.ts`，启动本地后端 HTTP 服务并加载前端页面
  - [ ] SubTask 2.3: 创建 `electron/preload.ts`，暴露安全的 `window.electronAPI`
  - [ ] SubTask 2.4: 更新 `package.json` 添加 `electron:dev`、`electron:build`、`package:desktop` 脚本
  - [ ] SubTask 2.5: 配置 `electron-builder.json` 或 `build` 字段

- [ ] Task 3: 实现本地配置持久化模块
  - [ ] SubTask 3.1: 创建 `electron/config.ts`，提供 `loadSettings()` 和 `saveSettings(settings)`
  - [ ] SubTask 3.2: 使用 `app.getPath('userData')` 存储 `settings.json`
  - [ ] SubTask 3.3: 定义 `AppSettings` 类型，包含 LLM 和 DSpark 配置

- [ ] Task 4: 调整后端服务读取配置
  - [ ] SubTask 4.1: 修改 `shared/llm.ts` 的 `chatCompletion`，允许通过 `env` 参数传入配置
  - [ ] SubTask 4.2: 修改 `shared/dspark.ts` 的 `createDSparkClient`，允许通过 `env` 参数传入配置
  - [ ] SubTask 4.3: 确保后端路由 `/api/settings` 可读取和更新配置
  - [ ] SubTask 4.4: 在 Electron 主进程中，将配置作为 `process.env` 注入或传给后端服务

- [ ] Task 5: 新增前端设置页面
  - [ ] SubTask 5.1: 创建 `src/pages/Settings.tsx`，包含 API Key、Base URL、Model、DSpark Endpoint 等表单
  - [ ] SubTask 5.2: 添加设置页面路由（如 `/settings`）
  - [ ] SubTask 5.3: 实现保存逻辑，调用后端 `/api/settings` 接口
  - [ ] SubTask 5.4: 在 UI 头部或侧边栏添加设置入口

- [ ] Task 6: 集成后端服务到 Electron
  - [ ] SubTask 6.1: 在 `electron/main.ts` 中导入并启动后端服务
  - [ ] SubTask 6.2: 确保后端服务使用本地配置而非 `.env`
  - [ ] SubTask 6.3: 处理窗口关闭时停止后端服务

- [ ] Task 7: 更新打包脚本
  - [ ] SubTask 7.1: 创建 `scripts/package-desktop.js`，调用 `electron-builder`
  - [ ] SubTask 7.2: 确保打包包含 `shared/`、`agents/`、`cloud-functions/`、前端 dist
  - [ ] SubTask 7.3: 在 `package.json` 中注册 `package:desktop` 脚本

- [ ] Task 8: 更新文档
  - [ ] SubTask 8.1: 更新 `README.md`，说明下载桌面应用、配置 API、即可使用
  - [ ] SubTask 8.2: 更新 `README_zh-CN.md`（如存在）
  - [ ] SubTask 8.3: 移除或弱化 `.env` 配置的说明

- [ ] Task 9: 构建与验证
  - [ ] SubTask 9.1: 运行 `npx tsc --noEmit` 确认无类型错误
  - [ ] SubTask 9.2: 运行 `npm run build` 确认前端构建成功
  - [ ] SubTask 9.3: 运行 `npm run package:desktop`，确认生成可执行程序或目录
  - [ ] SubTask 9.4: 如果可能，启动 Electron 应用验证设置页面和后端服务

# Task Dependencies
- Task 2 依赖于 Task 1
- Task 3 依赖于 Task 2
- Task 4 依赖于 Task 3
- Task 5 依赖于 Task 4
- Task 6 依赖于 Task 4 和 Task 5
- Task 7 依赖于 Task 6
- Task 8 可并行于 Task 7
- Task 9 依赖于 Task 7 和 Task 8
