# OpenAI Agents Starter

A full-stack EdgeOne Makers Agent template — streaming chat backed by the OpenAI Agents SDK (TypeScript), with custom tools and `context.store`-backed conversation memory.

**Framework:** OpenAI Agents SDK · **Category:** Quick Start <!-- TODO: confirm --> · **Language:** TypeScript

[![Deploy to EdgeOne Makers](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/makers/new?template=openai-agents-starter-node&from=within&fromAgent=1&agentLang=typescript)

<!-- ![preview](./assets/preview.png)  TODO: confirm -->

## Overview

A minimal, production-shaped starter that wires `@openai/agents` into EdgeOne Makers. Demonstrates the full chat loop — SSE streaming, custom tool registration, conversation persistence — so you can fork it and start replacing the toy tools (`get_weather`, `get_clothing_advice`, `translate_text`, `text_statistics`) with real ones.

- **SSE streaming chat** — token-by-token `text_delta` events plus `tool_called` events.
- **Custom Agent tools** — four sample tools registered via `createTools()`, ready to be replaced with your own.
- **Sticky conversation memory** — `context.store.openaiSession(conversationId)` plugs straight into the SDK's `session` parameter.
- **Dual cancellation** — frontend `AbortController` plus backend `AbortSignal` interrupts the LLM call mid-stream.
- **Two-folder backend** — long-running stateful work in `agents/`, short stateless `/history` in `cloud-functions/`.

## Persistent Local Memory

The agent maintains local persistent memory across sessions using SQLite FTS5:

- `MEMORY.md` — project-level knowledge and architecture decisions
- `checkpoint.md` — automatic session checkpoint maintained by the checkpoint-writer sub-agent
- `notes.md` — agent scratchpad for temporary notes
- `tasks/<id>/progress.md` — per-task progress logs

When a session resumes, the agent automatically injects relevant memories into the context, so you don't need to re-explain the project background.

Memory is available in desktop (Electron) and local Node.js environments. Cloud (EdgeOne Functions) and pure browser builds gracefully fall back to in-memory storage.

## Intelligent Context Management

The agent manages long-running conversations with token budgets:

- **Automatic checkpoints**: saves a session summary when token usage crosses the checkpoint threshold.
- **Context rebuild**: when approaching the context window limit, the agent rebuilds context from the latest checkpoint, task progress, relevant memories, and recent messages.
- **Budgeted injection**: checkpoint, task progress, and memory are injected under strict token budgets, sorted by relevance and priority.
- **Tree tasks**: tasks support nested sub-tasks (T1, T1.1, T1.2…), and task state is preserved across checkpoints.

Configure thresholds in Settings → Context Management.

## Settings & Compose Mode

The Settings panel provides centralized configuration:

- **Provider & Model**: choose your LLM provider, model, API key, and base URL.
- **Agents**: manage built-in agent permissions and create custom agents.
- **Context**: configure context window, checkpoint threshold, and budget ratios.
- **Memory**: view memory stats and clear all memories (desktop only).
- **MCP Servers**: connect to Model Context Protocol servers for additional tools.
- **Shortcuts & Theme**: customize keyboard shortcuts and switch between light/dark/system themes.

### Compose Mode

Use `/compose <spec>` to start a specs-driven development lifecycle:

1. Plan — understand the spec and split it into tasks.
2. Execute — call skills/subagents to implement code.
3. Review — review code and results.
4. TDD — generate and run tests.
5. Debug — diagnose and fix failures.
6. Validate — run checklist, type checks, and build verification.
7. Merge — finalize and summarize.

Additional commands:

- `/dream` — extract persistent knowledge from recent sessions into project memory.
- `/distill` — discover repetitive manual workflows and propose reusable skills/subagents/commands.

## Usage

This template supports two usage modes: **Cloud** and **Local**.

### Cloud Mode

Deploy to EdgeOne Makers. Visitors must log in before accessing the site. After logging in, they will see the product Demo and a local download entry for `agent-local-package.zip`.

[![Deploy to EdgeOne Makers](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/makers/new?template=openai-agents-starter-node&from=within&fromAgent=1&agentLang=typescript)

### Local Mode

Clone this repository from GitHub, or download `agent-local-package.zip` from the cloud deployment page. Unzip it, install dependencies, and start the local development server:

```bash
npm install
npm run dev
```

After logging in, you can use the full agent chat and management features.

### Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

At minimum, set `AI_GATEWAY_API_KEY` and `AI_GATEWAY_BASE_URL`. See the [Environment Variables](#environment-variables) section below for details.

### Build Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the local development server |
| `npm run build` | Build the project for local deployment |
| `npm run build:cloud` | Build the project for EdgeOne Makers cloud deployment |
| `npm run package:local` | Generate `agent-local-package.zip` for local installation |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AI_GATEWAY_API_KEY` | Yes | Model gateway API key. Use your Makers Models API Key, or any OpenAI-compatible provider key. |
| `AI_GATEWAY_BASE_URL` | Yes | Gateway base URL. For Makers Models, use `https://ai-gateway.edgeone.link/v1`. |
| `AI_GATEWAY_MODEL` | No | Model ID. Defaults to `@makers/deepseek-v4-flash` (a free built-in model). |
| `VITE_APP_MODE` | No | Runtime mode. `cloud` shows login, demo, and local download entry. `local` (default) enables full chat and management features. |
| `VITE_DIRECT_LLM` | No | When set to `true`, the frontend calls the LLM service directly without requiring a backend. Automatically enabled for mobile app builds. |

This template follows the OpenAI-compatible standard — point these at Makers Models or any compatible provider.

## On-Device Inference with MNN

This project uses Alibaba MNN for on-device inference acceleration. Unlike server-side frameworks, MNN runs locally inside the app, reducing latency and keeping data private.

### Key Features

- **Zero configuration**: MNN is built-in with default settings; no API keys or endpoints are required.
- **Cross-platform backend**: automatically selects CPU backend on Node.js/Electron and WASM backend in browsers.
- **Skill integration**: agents with the `skill_mnn` can trigger local inference through natural language.

### Current Status

The MNN adapter (`shared/mnn.ts`) currently ships as a TypeScript placeholder. The session creation, input preprocessing, and output postprocessing interfaces are ready; the actual MNN native/WASM backend can be plugged in later without changing the skill or agent APIs.

## How to get `AI_GATEWAY_API_KEY`

1. Open the [Makers Console](https://edgeone.ai/makers/new?s_url=https://console.tencentcloud.com/edgeone/makers).
2. Sign in and enable Makers.
3. Go to **Makers → Models → API Key** and create a key.
4. Copy it into `AI_GATEWAY_API_KEY`.

The built-in `@makers/deepseek-v4-flash` model is free with a usage cap and is suitable for prototyping. For production, bind your own paid provider (BYOK).

## Local Development

Prerequisites: Node.js ≥ 18.

```bash
npm install
cp .env.example .env       # then fill in AI_GATEWAY_API_KEY / AI_GATEWAY_BASE_URL
npm run dev
```

To develop the Makers agents locally, you can also use the EdgeOne CLI (`npm i -g edgeone`) and run `edgeone makers dev`.

Local agent metrics & traces are exposed at `http://localhost:8080/agent-metrics`.

## Mobile Apps

This template also ships as mobile apps for three platforms: **Android**, **iOS**, and **HarmonyOS**.

- All three platforms are supported out of the box.
- No environment variables are required for mobile builds — all API configuration is done in the in-app settings page.
- On first launch, the app automatically guides you to the settings page.
- You must configure the **AI Gateway API Key** (required), as well as the **Base URL** and **Model**.

## Build Mobile Apps

Build the mobile apps for each platform:

```bash
# Android
npm run build:android

# iOS
npm run build:ios

# HarmonyOS
npm run build:harmony
```

## Build Desktop Apps

Desktop applications for Windows, macOS, and Linux are built with Electron.

```bash
# Build all desktop platforms (auto-detect current OS)
npm run build:desktop

# Build for specific platform
npm run build:win    # Windows (.exe)
npm run build:mac    # macOS (.dmg)
npm run build:linux  # Linux (.AppImage)
```

## Cloud CI/CD

All platform builds are automated via GitHub Actions. Push a tag to trigger:

```bash
git tag v1.0.0
git push origin v1.0.0
```

This triggers builds for Web, Android, iOS, HarmonyOS, Windows, macOS, and Linux.
Artifacts are uploaded to GitHub Releases automatically.

## Project Structure

```text
openAI-agent-starter/
├── agents/                          # Stateful EdgeOne Makers Agent Functions (Node/TS)
│   ├── chat/index.ts               # POST /chat — SSE streaming chat
│   ├── stop/index.ts               # POST /stop — abort active agent run
│   ├── _logger.ts                  # Logger utility (private)
│   ├── _sse.ts                     # SSE helpers (private)
│   └── _tools.ts                   # Agent tool definitions (private)
├── cloud-functions/                 # Stateless EdgeOne Makers Node Functions
│   ├── history/index.ts            # POST /history — load conversation messages
│   └── _logger.ts                  # Logger utility
├── src/                             # React + Vite + TypeScript frontend
│   ├── App.tsx                     # Main app + SSE stream lifecycle
│   ├── api.ts                      # /chat, /stop, /history wrappers
│   └── components/                 # ChatWindow, ChatInput, CodeViewer, ToolIndicators, ...
├── package.json                     # Includes @openai/agents
├── edgeone.json                     # framework=openai-agents-sdk
├── vite.config.ts
├── tsconfig.json
└── .gitignore
```

> Files prefixed with `_` are private modules — not exposed as public routes.

## Resources

- [EdgeOne Makers Agents — Documentation](https://pages.edgeone.ai/document/agents)
- [EdgeOne Makers — Quick Start](https://pages.edgeone.ai/document/agents-quick-start)
- [Makers Models](https://pages.edgeone.ai/document/models)

## License

MIT.
