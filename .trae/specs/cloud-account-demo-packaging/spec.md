# 云端账户验证 + 产品 Demo + 本地打包下载 Spec

## Why
项目核心能力（智能体管理、自我成长、多轮对话）依赖本地 LLM API Key 与较大运行时资源，云端部署成本高且存在数据安全风险。因此将云端定位为「账户验证、产品演示与分发入口」，引导用户克隆 Git 仓库到本地打包使用完整功能。

## What Changes
- 新增云端模式入口页，提供账户登录/验证、产品 Demo 展示、Git 仓库克隆/打包下载指引。
- 通过构建时环境变量区分 `cloud`（云端）与 `local`（本地）两种运行模式。
- 云端模式下隐藏完整智能体管理、聊天、自我成长等需要本地资源的功能入口。
- 本地模式下保持当前完整功能不变。
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

### Requirement: 本地模式完整功能
The system SHALL 在本地打包运行时继续提供完整的智能体管理、聊天、历史记录、自我成长、创建智能体等功能。

#### Scenario: 用户本地启动应用
- **WHEN** 用户执行 `npm install && npm run dev`（本地模式）
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
- **THEN** 构建产物仅包含账户验证入口页和产品 Demo 页
- **AND** 不包含完整智能体管理、聊天等功能的代码入口

#### Scenario: 本地构建
- **WHEN** `VITE_APP_MODE=local` 或未设置
- **THEN** 构建产物包含当前完整功能

## REMOVED Requirements
无。
