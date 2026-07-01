# OpenAI Agents Starter

跑在 EdgeOne Makers 上的全栈 Agent 模板：基于 OpenAI Agents SDK（TypeScript）的流式聊天，包含自定义工具与基于 `context.store` 的会话记忆。

**Framework：** OpenAI Agents SDK · **Category：** Quick Start <!-- TODO: confirm --> · **Language：** TypeScript

[![Deploy to EdgeOne Makers](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://console.cloud.tencent.com/edgeone/pages/new?template=openai-agents-starter-node)

<!-- ![preview](./assets/preview.png)  TODO: confirm -->

## 概述

一个把 `@openai/agents` 接到 EdgeOne Makers 上的最小但贴近生产形态的模板。完整跑通了流式响应、自定义工具注册、会话存储这条链路，方便你直接 fork，把示例工具（`get_weather`、`get_clothing_advice`、`translate_text`、`text_statistics`）替换成你自己的实现。

- **SSE 流式聊天** —— 逐 token 推 `text_delta`，命中工具时推 `tool_called`。
- **自定义 Agent 工具** —— `createTools()` 注册的四个示例工具，可直接换成你自己的业务工具。
- **会话粘性记忆** —— `context.store.openaiSession(conversationId)` 直接喂给 SDK 的 `session` 参数。
- **双重取消** —— 前端 `AbortController` + 后端 `AbortSignal`，可中途打断 LLM。
- **后端拆两层** —— 有状态的长连接放 `agents/`，无状态的 `/history` 放 `cloud-functions/`。

## 使用方式

本模板支持两种使用方式：**云端模式** 和 **本地模式**。

### 云端模式

部署到 EdgeOne Makers。用户访问站点需先登录，登录后看到产品 Demo 和本地下载入口，可下载 `agent-local-package.zip`。

[![Deploy to EdgeOne Makers](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://console.cloud.tencent.com/edgeone/pages/new?template=openai-agents-starter-node)

### 本地模式

从 GitHub 克隆本仓库，或从云端部署页面下载 `agent-local-package.zip`。解压后安装依赖并启动本地开发服务器：

```bash
npm install
npm run dev
```

登录后即可使用完整的 Agent 聊天与管理功能。

### 环境变量配置

复制 `.env.example` 为 `.env`，并填写必要配置：

```bash
cp .env.example .env
```

至少需要设置 `AI_GATEWAY_API_KEY` 和 `AI_GATEWAY_BASE_URL`。详见下方的 [环境变量](#环境变量) 章节。

### 构建命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动本地开发服务器 |
| `npm run build` | 构建本地部署版本 |
| `npm run build:cloud` | 构建 EdgeOne Makers 云端部署版本 |
| `npm run package:local` | 生成用于本地安装的 `agent-local-package.zip` |

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `AI_GATEWAY_API_KEY` | 是 | 模型网关 API Key。可填 Makers Models 的 API Key，也可以是任意 OpenAI 兼容服务商的 Key。 |
| `AI_GATEWAY_BASE_URL` | 是 | 网关 Base URL。Makers Models 请使用 `https://ai-gateway.edgeone.link/v1`。 |
| `AI_GATEWAY_MODEL` | 否 | 模型 ID。默认 `@makers/deepseek-v4-flash`（内置免费模型）。 |
| `VITE_APP_MODE` | 否 | 运行模式。`cloud` 显示登录、Demo 和本地下载入口；`local`（默认）启用完整聊天与管理功能。 |
| `VITE_DIRECT_LLM` | 否 | 设置为 `true` 时，前端直接调用 LLM 服务，无需后端。移动端构建时自动启用。 |
| `DSPARK_ENDPOINT` | 否 | DSpark 服务地址。启用 **DSpark 数据分析** 技能时必须配置。 |
| `DSPARK_API_KEY` | 否 | DSpark 服务认证用的 API Key。 |
| `DSPARK_DEFAULT_CLUSTER` | 否 | 请求中未指定集群时使用的默认 DSpark 集群。 |

使用 **DSpark 数据分析** 技能前，需将 `DSPARK_ENDPOINT` 配置为可用的 DSpark 服务地址。`DSPARK_API_KEY` 和 `DSPARK_DEFAULT_CLUSTER` 为可选项，分别用于服务认证与指定默认集群。在 AgentsPanel 中为智能体勾选 **DSpark 数据分析** 技能，然后在对话中直接请求数据分析任务即可。

模板遵循 OpenAI 兼容协议，可以指向 Makers Models，也可以指向任意 OpenAI 兼容的服务商。

### 如何获取 `AI_GATEWAY_API_KEY`

1. 打开 [Makers 控制台](https://console.cloud.tencent.com/edgeone/makers)。
2. 登录并开通 Makers。
3. 进入 **Makers → Models → API Key**，新建一个 Key。
4. 把它粘到 `AI_GATEWAY_API_KEY`。

内置的 `@makers/deepseek-v4-flash` 免费但有用量限制，适合验证；生产建议自行绑定付费厂商（BYOK）。

## 本地开发

前置依赖：Node.js ≥ 18。

```bash
npm install
cp .env.example .env       # 然后填入 AI_GATEWAY_API_KEY / AI_GATEWAY_BASE_URL
npm run dev
```

如需本地开发 Makers Agents，也可安装 EdgeOne CLI（`npm i -g edgeone`）并运行 `edgeone makers dev`。

本地观测面板：`http://localhost:8080/agent-metrics`。

## 移动端应用

本模板同时提供 **Android**、**iOS**、**鸿蒙（HarmonyOS）** 三个平台的移动端应用。

- 三端开箱即用。
- 移动端无需配置环境变量，所有 API 配置均在应用内设置页面完成。
- 首次打开应用会自动引导到设置页面。
- 需配置 **AI Gateway API Key**（必填），以及 **Base URL** 和 **Model**。
- 可选配置 **DSpark Endpoint**，用于启用 DSpark 数据分析技能。

## 构建移动端应用

按平台执行对应构建命令：

```bash
# Android
npm run build:android

# iOS
npm run build:ios

# HarmonyOS
npm run build:harmony
```

## 项目结构

```text
openAI-agent-starter/
├── agents/                          # 有状态的 EdgeOne Makers Agent Functions（Node/TS）
│   ├── chat/index.ts               # POST /chat —— SSE 流式聊天
│   ├── stop/index.ts               # POST /stop —— 中断当前 agent
│   ├── _logger.ts                  # 日志工具（私有）
│   ├── _sse.ts                     # SSE 工具（私有）
│   └── _tools.ts                   # Agent 工具定义（私有）
├── cloud-functions/                 # 无状态的 EdgeOne Makers Node Functions
│   ├── history/index.ts            # POST /history —— 拉取对话消息
│   └── _logger.ts                  # 日志工具
├── src/                             # React + Vite + TypeScript 前端
│   ├── App.tsx                     # 主应用 + SSE 流生命周期管理
│   ├── api.ts                      # /chat、/stop、/history 接口封装
│   └── components/                 # ChatWindow、ChatInput、CodeViewer、ToolIndicators 等
├── package.json                     # 含 @openai/agents
├── edgeone.json                     # framework=openai-agents-sdk
├── vite.config.ts
├── tsconfig.json
└── .gitignore
```

> 以 `_` 开头的文件是私有模块，不会暴露为公开路由。

## 资源

- [EdgeOne Makers Agents 文档](https://cloud.tencent.com/document/product/1552/132759)
- [EdgeOne Makers 快速开始](https://cloud.tencent.com/document/product/1552/132786)
- [Makers Models](https://cloud.tencent.com/document/product/1552/132748)

## License

MIT.
