# HarmonyOS 工程说明

本目录是 AI Agent 的鸿蒙（HarmonyOS）原生工程，使用 ArkTS + Web 组件加载前端构建产物。

## 工程结构

```
harmony/
├── entry/                              # 主模块
│   └── src/
│       └── main/
│           ├── ets/
│           │   ├── entryability/
│           │   │   └── EntryAbility.ets   # 应用入口 Ability
│           │   └── pages/
│           │       └── Index.ets          # 主页面，承载 Web 组件
│           └── resources/
│               └── rawfile/               # 前端构建产物（dist/ 复制到此）
│                   ├── index.html
│                   └── assets/
├── build-profile.json5                  # 工程构建配置
├── oh-package.json5                     # 工程包配置
└── README.md
```

## 工作原理

1. `EntryAbility` 是应用启动入口，加载 `pages/Index` 页面。
2. `Index` 页面使用 ArkUI 的 `Web` 组件加载 `$rawfile('index.html')`。
3. 前端构建产物（HTML/CSS/JS）通过构建脚本复制到 `entry/src/main/resources/rawfile/` 目录，运行时由 Web 组件加载。
4. 前端在 `VITE_DIRECT_LLM=true` 模式下构建，使前端直连 LLM，无需后端代理，适配鸿蒙的离线/本地运行场景。

## 构建方式

### 一键构建前端产物并同步到 rawfile

在仓库根目录执行：

```bash
npm run build:harmony
```

该命令会：

1. 使用 `VITE_DIRECT_LLM=true` 运行 `vite build`，生成 `dist/` 产物。
2. 清空 `harmony/entry/src/main/resources/rawfile/` 目录中的旧文件。
3. 将 `dist/` 内容复制到 `harmony/entry/src/main/resources/rawfile/`。

### 构建 HAP 安装包

1. 安装 [DevEco Studio](https://developer.huawei.com/consumer/cn/deveco-studio/)。
2. 在 DevEco Studio 中通过 `File > Open` 打开 `harmony/` 目录。
3. 等待 IDE 完成依赖同步与索引。
4. 点击 `Build > Build HAP(s)/APP(s) > Build HAP(s)` 生成安装包。
5. 使用真机或模拟器进行运行与调试。

## 关键配置说明

- `build-profile.json5`：声明了 `default` product 与 `entry` 模块，`compatibleSdkVersion` 设为 `5.0.0(12)`。
- `oh-package.json5`：工程级别的包元信息。
- `EntryAbility.ets`：仅做窗口与页面加载，不包含业务逻辑。
- `Index.ets`：Web 组件开启 `javaScriptAccess`、`domStorageAccess`、`fileAccess` 与 `mixedMode`，以兼容前端所需的本地存储与混合资源加载。

## 注意事项

- 前端构建必须使用 `VITE_DIRECT_LLM=true`，否则在鸿蒙 Web 组件内无法访问云端后端代理。
- 如需调试 Web 内容，可将 `Index.ets` 中 `webview.WebviewController.setWebDebuggingAccess(false)` 改为 `true`，并通过 `chrome://inspect` 连接调试。
- `.ets` 文件不在仓库根 `tsconfig.json` 的 `include` 范围内，不影响 `tsc --noEmit` 校验。
