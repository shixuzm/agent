# 移动端应用打包 Spec

## Why
用户需要安卓、苹果、鸿蒙三个平台的应用程序，而不是桌面程序或源码包。同时用户不应接触环境变量或配置文件，所有 API 和端点必须在应用内设置页面配置。

## What Changes
- 使用 Capacitor 将现有 Vite + React 前端打包为 Android 和 iOS 应用。
- 提供鸿蒙应用的最小适配方案（基于鸿蒙 WebView 加载本地前端产物，复用同一套代码）。
- 在应用内新增「设置」页面，支持配置 AI Gateway API Key、Base URL、Model、DSpark Endpoint 等。
- 将配置持久化到移动端本地存储（Capacitor Preferences / 鸿蒙 LocalStorage），替代 `.env` 环境变量。
- 新增 `capacitor.config.ts` 和打包脚本 `npm run package:mobile`。
- 更新 `README.md`，说明下载安装 APK / IPA / HAP 后，在应用内设置 API 即可使用。

## Impact
- Affected specs: 本地部署与打包、配置管理、前端设置、移动端适配。
- Affected code: 新增 `capacitor.config.ts`、`src/pages/Settings.tsx`、打包脚本；修改 `shared/llm.ts`、`shared/dspark.ts` 以支持运行时从请求上下文读取配置；可能新增 `android/`、`ios/`、`harmony/` 目录。

## ADDED Requirements
### Requirement: Android 和 iOS 应用
The system SHALL 使用 Capacitor 生成 Android 和 iOS 工程，用户安装后可直接运行。

#### Scenario: 生成移动应用
- **WHEN** 运行 `npm run package:mobile`
- **THEN** 生成 Android APK / AAB 和 iOS 工程
- **AND** 用户安装后无需环境配置即可打开应用

### Requirement: 鸿蒙应用
The system SHALL 提供鸿蒙应用的最小工程，复用同一套前端产物。

#### Scenario: 鸿蒙用户安装应用
- **WHEN** 构建鸿蒙工程
- **THEN** 生成 HAP 安装包
- **AND** 鸿蒙应用使用 WebView 加载本地前端资源
- **AND** 用户同样通过应用内设置配置 API

### Requirement: 应用内设置页面
The system SHALL 在移动端应用内提供设置页面，替代 `.env` 配置。

#### Scenario: 配置 API
- **WHEN** 用户打开设置页面
- **THEN** 显示表单：AI Gateway API Key、Base URL、Model、DSpark Endpoint、DSpark API Key
- **AND** 保存后配置写入本地存储
- **AND** 后续 API 调用使用新配置

### Requirement: 运行时配置读取
The system SHALL 让后端/框架代码从运行时上下文中读取配置，而非仅依赖 `process.env`。

#### Scenario: 配置更新后生效
- **WHEN** 用户保存新配置
- **THEN** 前端将配置传给后端运行时
- **AND** 后续 LLM / DSpark 调用使用新配置

## MODIFIED Requirements
### Requirement: 本地打包产物
The system SHALL 生成的本地产物为移动应用安装包（APK / IPA / HAP），而非源码 zip 或桌面可执行程序。

## REMOVED Requirements
- 桌面可执行程序打包需求（由本 spec 替代）。
