# Tasks

- [ ] Task 1: 读取当前前端入口与路由结构
  - [ ] SubTask 1.1: 读取 `src/App.tsx` 与 `src/main.tsx`，了解当前路由与渲染逻辑
  - [ ] SubTask 1.2: 读取 `package.json` 脚本与依赖，确认构建命令
  - [ ] SubTask 1.3: 读取 `vite.config.ts`，了解构建配置入口

- [ ] Task 2: 实现云端模式入口页组件
  - [ ] SubTask 2.1: 创建 `src/components/CloudLandingPage.tsx` 组件，包含登录/验证入口、产品 Demo 区、Git 克隆命令、打包下载按钮
  - [ ] SubTask 2.2: 创建 `src/components/CloudLandingPage.module.css` 样式文件
  - [ ] SubTask 2.3: 在组件中使用环境变量读取仓库地址与打包下载链接

- [ ] Task 3: 实现应用模式切换逻辑
  - [ ] SubTask 3.1: 在 `src/App.tsx` 中根据 `import.meta.env.VITE_APP_MODE` 渲染云端入口页或本地完整应用
  - [ ] SubTask 3.2: 确保本地模式默认展示完整功能，行为与当前一致
  - [ ] SubTask 3.3: 在 `vite-env.d.ts` 中补充 `VITE_APP_MODE` 类型声明

- [ ] Task 4: 配置云端与本地构建脚本
  - [ ] SubTask 4.1: 在 `package.json` 中添加 `build:cloud` 脚本（设置 `VITE_APP_MODE=cloud`）
  - [ ] SubTask 4.2: 保留默认 `build` 脚本为本地模式
  - [ ] SubTask 4.3: 更新 `edgeone.json` 的 `buildCommand`，云端部署使用 `npm run build:cloud`

- [ ] Task 5: 实现自动打包脚本
  - [ ] SubTask 5.1: 创建 `scripts/package-local.js`，将源码、README、.env.example、package.json 等打包成 zip
  - [ ] SubTask 5.2: 在 `package.json` 中添加 `package:local` 脚本
  - [ ] SubTask 5.3: 运行脚本验证压缩包生成成功

- [ ] Task 6: 更新文档说明
  - [ ] SubTask 6.1: 更新 `README.md`，说明云端（账户验证 + Demo + 下载）与本地（完整功能）两种使用方式
  - [ ] SubTask 6.2: 更新 `.env.example`，添加 `VITE_APP_MODE` 说明
  - [ ] SubTask 6.3: 更新 `README_zh-CN.md`（如存在）

- [ ] Task 7: 构建与验证
  - [ ] SubTask 7.1: 运行 `npm run build:cloud`，确认云端产物仅包含入口页
  - [ ] SubTask 7.2: 运行 `npm run build`，确认本地产物包含完整功能
  - [ ] SubTask 7.3: 运行 `npm run package:local`，确认压缩包生成

# Task Dependencies
- Task 2 依赖于 Task 1
- Task 3 依赖于 Task 1 和 Task 2
- Task 4 依赖于 Task 3
- Task 5 可并行于 Task 4
- Task 6 依赖于 Task 3 和 Task 5
- Task 7 依赖于 Task 4、Task 5、Task 6
