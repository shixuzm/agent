# 本地打包为独立可执行程序 Spec

## Why
当前本地安装包是源码 zip，用户需要解压、安装依赖、配置 `.env`、手动启动服务，门槛较高。为了降低使用门槛，需要将本地版本打包为独立可执行程序：内置前端、后端服务与框架代码，无需环境配置文件，所有 API 和端点通过应用内设置页面配置。

## What Changes
- 新增 Electron 主进程入口，在本地启动 Express/Node 后端服务并加载前端页面。
- 将 `shared/`、`agents/`、`cloud-functions/` 等框架代码作为后端服务的一部分运行。
- 新增设置页面，支持在应用内配置 LLM API Key、Base URL、Model、DSpark Endpoint 等。
- 将配置持久化到本地文件（如 `settings.json`），替代 `.env` 环境变量。
- 新增打包脚本 `npm run package:desktop`，生成 Windows / macOS / Linux 可执行程序。
- 更新 `README.md`，说明下载可执行程序、打开设置、配置 API 即可使用。

## Impact
- Affected specs: 本地部署与打包、配置管理、前端设置、后端启动方式。
- Affected code: 新增 `electron/main.ts`、`electron/preload.ts`、`src/pages/Settings.tsx`、打包脚本；修改 `shared/llm.ts`、`shared/dspark.ts`、`shared/store.ts` 以支持从本地配置读取环境变量。

## ADDED Requirements
### Requirement: 桌面应用主进程
The system SHALL 提供一个 Electron 主进程，启动本地后端服务并加载前端页面。

#### Scenario: 启动桌面应用
- **WHEN** 用户双击运行可执行程序
- **THEN** 主进程启动本地 HTTP 服务
- **AND** 打开窗口加载前端页面
- **AND** 用户无需手动运行 npm install 或 npm run dev

### Requirement: 应用内设置页面
The system SHALL 提供设置页面，允许用户配置 API Key、Base URL、Model、DSpark Endpoint 等。

#### Scenario: 配置 API
- **WHEN** 用户打开设置页面
- **THEN** 显示表单：AI Gateway API Key、Base URL、Model、DSpark Endpoint、DSpark API Key
- **AND** 用户保存后配置写入本地持久化存储
- **AND** 后端服务立即使用新配置

### Requirement: 本地配置持久化
The system SHALL 将用户配置保存到本地文件，启动时自动读取。

#### Scenario: 应用重启后保留配置
- **WHEN** 用户保存配置后关闭并重新打开应用
- **THEN** 设置页面显示上次保存的配置
- **AND** 后端服务继续使用该配置

### Requirement: 独立可执行程序打包
The system SHALL 提供打包脚本，生成 Windows / macOS / Linux 可执行程序。

#### Scenario: 生成本地安装包
- **WHEN** 运行 `npm run package:desktop`
- **THEN** 输出单文件或可执行目录到 `dist/desktop/`
- **AND** 用户可直接运行，无需 Node.js 环境

## MODIFIED Requirements
### Requirement: 后端服务读取配置方式
The system SHALL 允许后端服务从 Electron 主进程传入的配置对象读取环境变量，而不仅依赖 `process.env`。

#### Scenario: 配置更新后生效
- **WHEN** 用户在设置页面保存新配置
- **THEN** 主进程通知后端服务更新 env
- **AND** 后续 LLM / DSpark 调用使用新配置

## REMOVED Requirements
无。
