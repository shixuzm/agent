# 统一云端构建全平台应用 Spec

## Why
当前已支持 Android/iOS/鸿蒙移动端，但缺少桌面端（Windows/macOS/Linux）支持，且构建流程需本地手动执行。需要补齐桌面端覆盖、建立云端 CI/CD 自动构建流水线，并彻底移除所有环境变量依赖，实现六平台统一打包。

## What Changes
- 引入 Electron + electron-builder，将前端打包为 Windows/macOS/Linux 桌面应用。
- 新增云端 CI/CD 工作流（GitHub Actions），一键构建全部六平台产物。
- 彻底移除 `.env` / `.env.example` 中所有运行时环境变量依赖，仅保留构建期 `VITE_*` 变量。
- 将项目重构为清晰的模块化结构，每个模块职责单一，允许使用不同语言（TypeScript / ArkTS / Swift / Kotlin / Shell）。
- 新增 `docs/modules.md` 模块架构说明文档。

## Impact
- Affected specs: 桌面端打包、云端构建流水线、环境变量管理、模块化架构。
- Affected code: `electron/`（新增）、`.github/workflows/`（新增）、`package.json`、`vite.config.ts`、`.env.example`、`docs/modules.md`（新增）。

## ADDED Requirements
### Requirement: Electron 桌面应用
The system SHALL 使用 Electron 将前端打包为 Windows（exe/nsis）、macOS（dmg）、Linux（AppImage）桌面应用。

#### Scenario: Windows 用户使用
- **WHEN** 用户下载并双击 .exe 安装包
- **THEN** 安装后可直接运行
- **AND** 无需安装 Node.js 或任何依赖

#### Scenario: macOS 用户使用
- **WHEN** 用户下载并打开 .dmg 文件
- **THEN** 拖拽到 Applications 即可使用
- **AND** 无需终端操作

### Requirement: 云端 CI/CD 构建流水线
The system SHALL 提供 GitHub Actions 工作流，在云端自动构建全部六平台产物。

#### Scenario: 触发云端构建
- **WHEN** 推送 tag（如 v1.0.0）或手动触发 workflow
- **THEN** 云端依次构建 Web、Android、iOS、鸿蒙、Windows、macOS、Linux 产物
- **AND** 将产物上传到 GitHub Releases 或 Artifacts

### Requirement: 模块化架构
The system SHALL 按模块化组织代码，每个模块职责单一，允许使用不同编程语言。

#### Scenario: 模块独立性
- **WHEN** 开发者修改某个模块
- **THEN** 不影响其他模块
- **AND** 每个模块有清晰的入口和接口

## MODIFIED Requirements
### Requirement: 环境变量管理
The system SHALL 彻底移除运行时环境变量依赖，所有 API 配置仅在应用内设置页面完成。

#### Scenario: 无环境变量运行
- **WHEN** 用户在任意平台运行应用
- **THEN** 不读取任何 `.env` 文件或 `process.env` 变量
- **AND** 所有配置从 localStorage（移动端/Web）或 electron-store（桌面端）读取

## REMOVED Requirements
### Requirement: 依赖 .env 文件的运行时配置
**Reason**: 全平台用户无法编辑 `.env` 文件，已由应用内设置页面完全替代。
**Migration**: `.env.example` 仅保留构建期变量（如 `VITE_APP_MODE`）说明，运行时配置全部通过设置页面。
