# 云端账户验证 + 产品 Demo + 本地打包下载 Spec

## Why
项目核心能力（智能体管理、自我成长、多轮对话）依赖本地 LLM API Key 与较大运行时资源，云端部署成本高且存在数据安全风险。因此将云端定位为「账户验证、产品演示与分发入口」，引导用户克隆 Git 仓库到本地打包使用完整功能。

## What Changes
- 新增统一登录/账户验证机制：无论云端还是本地，未登录时自动跳转到登录界面。
- 新增云端模式入口页，登录后展示产品 Demo、Git 仓库克隆命令与打包下载指引。
- 通过构建时环境变量区分 `cloud`（云端）与 `local`（本地）两种运行模式。
- 云端模式下隐藏完整智能体管理、聊天、自我成长等需要本地资源的功能入口。
- 本地模式下，用户登录后展示完整功能。
- 新增自动打包脚本，支持一键生成可离线使用的本地安装包（zip/tar.gz）。
- 更新 `README` 与 `.env.example`，说明两种使用方式。

## Impact
- Affected specs: 用户认证、前端路由、功能开关、构建流程、项目文档。
- Affected code: `src/App.tsx`、前端组件、`package.json` 构建脚本、Vite 配置、`README.md`、`.env.example`。

## ADDED Requirements
### Requirement: 云端模式入口页
The system SHALL 在云端部署时展示一个入口页，包含账户登录/验证、产品 Demo 介绍、Git 仓库克隆命令与打包下载链接。

#### Scenario: 用户访问云端站点
- **WHEN** 用户访问云端部署的站点
- **THEN** 页面展示登录/验证入口
- **AND** 展示产品 Demo 视频或截图
- **AND** 展示 `git clone https://github.com/shixuzm/agent` 命令
- **AND** 提供打包下载按钮（下载包含源码与安装说明的压缩包）

### Requirement: 统一登录验证
The system SHALL 在云端和本地两种模式下均要求用户先登录，未登录时自动展示登录界面，禁止进入后续功能。

#### Scenario: 未登录访问应用
- **WHEN** 用户访问应用（无论云端还是本地）且未登录
- **THEN** 页面自动跳转或展示登录界面
- **AND** 无法看到产品 Demo 详情、下载入口或完整功能界面

#### Scenario: 登录成功后
- **WHEN** 用户完成登录
- **THEN** 根据当前模式进入对应页面：云端模式进入 Demo/下载页，本地模式进入完整功能页

### Requirement: 本地模式完整功能
The system SHALL 在本地打包运行且用户已登录后，提供完整的智能体管理、聊天、历史记录、自我成长、创建智能体等功能。

#### Scenario: 用户本地启动应用并登录
- **WHEN** 用户执行 `npm install && npm run dev`（本地模式）并完成登录
- **THEN** 应用展示完整功能界面
- **AND** 聊天、智能体管理、自我成长等功能可用

### Requirement: 自动打包脚本
The system SHALL 提供一个脚本，自动将当前仓库打包成可下载的压缩文件，包含源码、README、.env.example 和安装说明。

#### Scenario: 运行打包脚本
- **WHEN** 用户执行 `npm run package:local`
- **THEN** 生成 `dist/agent-local-package.zip`（或 tar.gz）
- **AND** 压缩包内包含运行项目所需的全部源码与说明

## MODIFIED Requirements
### Requirement: 应用模式切换
The system SHALL 根据构建时环境变量 `VITE_APP_MODE` 决定应用运行在云端模式还是本地模式。

#### Scenario: 云端构建
- **WHEN** `VITE_APP_MODE=cloud`
- **THEN** 构建产物包含统一登录页和产品 Demo/下载页
- **AND** 不包含完整智能体管理、聊天等功能的代码入口
- **AND** 用户未登录时仅展示登录界面

#### Scenario: 本地构建
- **WHEN** `VITE_APP_MODE=local` 或未设置
- **THEN** 构建产物包含统一登录页和完整功能界面
- **AND** 用户未登录时仅展示登录界面

## REMOVED Requirements
无。
