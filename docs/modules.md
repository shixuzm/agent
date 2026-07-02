# 模块架构说明

## 模块清单

| 模块 | 目录 | 技术栈 | 职责 |
|------|------|--------|------|
| 前端 UI | `src/` | React + TypeScript + Vite | 用户界面、聊天交互、设置页面 |
| 核心逻辑 | `shared/` | TypeScript | 智能体管理、技能执行、会话存储 |
| 记忆存储 | `shared/memory/` | TypeScript + SQLite/FTS5/sql.js | 本地持久化记忆、FTS5 全文检索、Markdown 双向同步 |
| 上下文管理 | `shared/context/` | TypeScript | Token 预算、上下文重建、自动检查点、树状任务 |
| Compose 编排 | `shared/compose/` | TypeScript | 从 spec 到交付的完整开发生命周期编排 |
| Dream/Distill | `shared/dream.ts`, `shared/distill.ts` | TypeScript | 知识提取与工作流提炼 |
| checkpoint-writer | `shared/orchestrator.ts` | TypeScript | 自动维护会话检查点的子智能体 |
| LLM 适配 | `shared/llm.ts` | TypeScript + OpenAI SDK | 调用 LLM 服务（DeepSeek/GPT等） |
| MNN 端侧推理 | `shared/mnn.ts` | TypeScript | 端侧推理适配（当前为占位实现） |
| 配置桥接 | `shared/configProvider.ts` | TypeScript | 前端配置注入到 shared 模块 |
| 应用配置 | `src/lib/appConfig.ts` | TypeScript | localStorage 配置持久化 |
| 桌面壳 | `electron/` | Electron + TypeScript | Windows/macOS/Linux 桌面应用容器 |
| Android 壳 | `android/` | Kotlin/Java + Capacitor | Android 原生应用容器 |
| iOS 壳 | `ios/` | Swift + Capacitor | iOS 原生应用容器 |
| 鸿蒙壳 | `harmony/` | ArkTS | 鸿蒙原生应用容器 |
| 构建脚本 | `scripts/` | JavaScript/Shell | 各平台构建与打包脚本 |
| 云端 CI/CD | `.github/workflows/` | YAML | GitHub Actions 自动构建流水线 |

## 模块间依赖关系

```
前端 UI (src/)
  ├── appConfig (src/lib/appConfig.ts)
  │     └── localStorage
  ├── configProvider (shared/configProvider.ts)
  │     └── 注入到 shared 模块
  ├── LLM 适配 (shared/llm.ts)
  │     └── OpenAI SDK
  ├── MNN 端侧推理 (shared/mnn.ts)
  │     └── 占位实现，后续可接入原生/WASM 后端
  ├── 核心逻辑 (shared/store.ts)
  │     └── MemoryStore (浏览器) / KVStore (EdgeOne)
  └── 上下文管理 (shared/context/)
        ├── 预算分配 (budget.ts)
        ├── 检查点 (checkpoint.ts)
        ├── 上下文重建 (rebuild.ts)
        └── 树状任务 (tasks.ts)

上下文管理 (shared/context/)
  ├── orchestrator ── 调用预算与重建逻辑
  ├── chat ── 长会话触发检查点/重建
  ├── memory ── 注入相关记忆
  └── tasks ── 注入任务进展

Compose 编排 (shared/compose/)
  ├── orchestrator ── 调度 spec 生命周期阶段
  ├── chat ── 接收 /compose 命令并返回结果
  └── skills ── 调用工具实现各阶段任务

Dream/Distill (shared/dream.ts, shared/distill.ts)
  ├── chat ── 接收 /dream 与 /distill 命令
  ├── memory ── 写入提炼后的知识与工作流
  └── skills ── 分析近期会话并生成 reusable 产物

平台壳层
  ├── Electron (electron/) → 加载 dist/
  ├── Android (android/) → Capacitor WebView 加载 dist/
  ├── iOS (ios/) → Capacitor WebView 加载 dist/
  └── 鸿蒙 (harmony/) → ArkTS Web 组件加载 rawfile/
```

## 设计原则

1. **单一职责**：每个模块只做一件事
2. **语言自由**：每个模块可选择最适合的语言（TS/ArkTS/Swift/Kotlin）
3. **松耦合**：模块间通过明确接口通信，不直接依赖内部实现
4. **无环境变量**：所有运行时配置通过应用内设置页面管理
5. **云端构建**：所有平台产物在 GitHub Actions 云端构建
