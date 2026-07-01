# 移动端多平台应用打包 Spec（Android / iOS / 鸿蒙）

## Why
当前应用仅支持 Web 访问，用户需要部署服务器和配置环境变量。为了覆盖移动端用户，需要将应用打包为 Android、iOS、鸿蒙原生应用，内置完整前端与框架逻辑，通过应用内设置页面配置 API，无需环境变量、无需服务器、无需解压。

## What Changes
- 引入 Capacitor 框架，将现有 Vite + React 前端打包为 Android 和 iOS 原生应用。
- 鸿蒙平台通过 ArkTS WebView 组件加载同一前端产物。
- 新增应用内设置页面，替代 `.env` 环境变量，用户在 App 内配置 API Key、Base URL、Model 等。
- 将 `shared/` 中可运行在浏览器端的逻辑（LLM 调用、技能执行、智能体管理）直接打包进前端 bundle。
- 配置持久化到 `localStorage`，应用重启后自动恢复。
- 新增 `npm run build:android`、`npm run build:ios`、`npm run build:harmony` 打包脚本。

## Impact
- Affected specs: 本地部署与打包、配置管理、前端设置、后端调用方式。
- Affected code: `src/pages/Settings.tsx`（新增）、`src/lib/appConfig.ts`（新增）、`shared/llm.ts`、`shared/dspark.ts`、`shared/store.ts`、`shared/skills.ts`、`package.json`、`capacitor.config.ts`（新增）、`harmony/`（新增）。

## ADDED Requirements
### Requirement: 应用内设置页面
The system SHALL 提供设置页面，允许用户在 App 内配置 LLM API Key、Base URL、Model、DSpark Endpoint 等，无需编辑环境变量文件。

#### Scenario: 首次使用配置 API
- **WHEN** 用户首次打开 App 且未配置 API
- **THEN** 自动跳转到设置页面
- **AND** 显示表单：AI Gateway API Key、Base URL、Model、DSpark Endpoint、DSpark API Key
- **WHEN** 用户填写并保存
- **THEN** 配置写入 localStorage
- **AND** 跳转到主功能页面

#### Scenario: 修改配置
- **WHEN** 用户从侧边栏或头部进入设置页面
- **THEN** 显示当前已保存的配置
- **AND** 用户修改后保存即可生效

### Requirement: 本地配置持久化
The system SHALL 将用户配置保存到 localStorage，启动时自动读取并注入到 shared 模块。

#### Scenario: 应用重启后保留配置
- **WHEN** 用户保存配置后关闭并重新打开 App
- **THEN** 自动从 localStorage 读取配置
- **AND** LLM 和 DSpark 调用使用已保存的配置

### Requirement: 客户端直连 LLM 服务
The system SHALL 在前端直接调用 LLM API，无需本地后端服务器中转。

#### Scenario: 发送聊天消息
- **WHEN** 用户在 App 中发送消息
- **THEN** 前端使用 localStorage 中的 API Key 和 Base URL 直接调用 LLM 服务
- **AND** 返回回复显示在聊天窗口

### Requirement: Android 应用打包
The system SHALL 提供 `npm run build:android` 脚本，生成 Android APK 或 AAB。

#### Scenario: 生成 Android 应用
- **WHEN** 运行 `npm run build:android`
- **THEN** 构建前端产物
- **AND** 通过 Capacitor 同步到 Android 工程
- **AND** 输出 APK 到 `dist/android/`

### Requirement: iOS 应用打包
The system SHALL 提供 `npm run build:ios` 脚本，生成 iOS Xcode 工程。

#### Scenario: 生成 iOS 应用
- **WHEN** 运行 `npm run build:ios`
- **THEN** 构建前端产物
- **AND** 通过 Capacitor 同步到 iOS 工程
- **AND** 输出 Xcode 项目到 `ios/`

### Requirement: 鸿蒙应用打包
The system SHALL 提供 `npm run build:harmony` 脚本，生成鸿蒙应用工程。

#### Scenario: 生成鸿蒙应用
- **WHEN** 运行 `npm run build:harmony`
- **THEN** 构建前端产物
- **AND** 复制到鸿蒙工程的 `rawfile` 目录
- **AND** 输出鸿蒙工程到 `dist/harmony/`

## MODIFIED Requirements
### Requirement: shared 模块配置读取方式
The system SHALL 允许 shared 模块（llm、dspark、store）从 `appConfig` 读取配置，而非仅依赖 `env` 参数。

#### Scenario: 前端调用 LLM
- **WHEN** 前端调用 `chatCompletion`
- **THEN** 优先使用 `appConfig.get()` 中的配置
- **AND** 若 appConfig 无配置则回退到 `env` 参数

## REMOVED Requirements
### Requirement: 依赖 .env 文件配置环境变量
**Reason**: 移动端用户无法编辑 `.env` 文件，改为应用内设置页面。
**Migration**: 现有 `.env` 配置在 Web/本地开发模式下仍然有效，移动端使用 appConfig 替代。
