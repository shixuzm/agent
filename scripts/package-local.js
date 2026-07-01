import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'dist');
const outputPath = path.join(outputDir, 'agent-local-package.zip');

const entries = [
  'src',
  'shared',
  'agents',
  'cloud-functions',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'vite.config.ts',
  '.env.example',
  'README.md',
  'README_zh-CN.md',
  'index.html',
  'LICENSE',
];

const excludePatterns = [
  /^node_modules$/,
  /^\.git$/,
  /^dist$/,
  /^\.edgeone$/,
  /\.log$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.gif$/,
  /\.webp$/,
  /\.DS_Store$/,
];

function shouldExclude(name) {
  return excludePatterns.some((pattern) => pattern.test(name));
}

function collectFiles(dir, basePath = '') {
  const result = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    if (shouldExclude(item.name)) continue;
    const relativePath = path.join(basePath, item.name);
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      result.push(...collectFiles(fullPath, relativePath));
    } else {
      result.push(relativePath);
    }
  }
  return result;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

if (fs.existsSync(outputPath)) {
  fs.unlinkSync(outputPath);
}

const zip = new AdmZip();
const added = new Set();

for (const entry of entries) {
  const entryPath = path.join(rootDir, entry);
  if (!fs.existsSync(entryPath)) {
    console.warn(`跳过不存在的条目: ${entry}`);
    continue;
  }

  const stat = fs.statSync(entryPath);
  if (stat.isDirectory()) {
    const files = collectFiles(entryPath, entry);
    for (const file of files) {
      if (added.has(file)) continue;
      const fullPath = path.join(rootDir, file);
      zip.addLocalFile(fullPath, path.dirname(file).replace(/\\/g, '/'));
      added.add(file);
    }
  } else {
    zip.addLocalFile(entryPath, '', path.basename(entry));
    added.add(entry);
  }
}

const installMd = `# 本地安装与运行指南

## 环境要求

- Node.js 18+
- npm 9+

## 使用方式

本安装包对应「本地模式」，解压后安装依赖即可运行完整功能。

\`\`\`bash
npm install
npm run dev
\`\`\`

启动后，按终端提示的地址在浏览器中打开，登录后即可使用完整的 Agent 聊天与管理功能。

云端部署页面还提供 \`agent-local-package.zip\` 下载入口，用户可下载本包后按上述步骤本地运行。

## 配置说明

1. 复制环境变量示例文件：

   \`\`\`bash
   cp .env.example .env
   \`\`\`

2. 打开 \`.env\`，至少填写以下变量：

   | 变量 | 必填 | 说明 |
   |------|------|------|
   | \`AI_GATEWAY_API_KEY\` | 是 | 模型网关 API Key |
   | \`AI_GATEWAY_BASE_URL\` | 是 | 网关 Base URL，Makers Models 使用 \`https://ai-gateway.edgeone.link/v1\` |
   | \`AI_GATEWAY_MODEL\` | 否 | 模型 ID，默认 \`@makers/deepseek-v4-flash\` |
   | \`VITE_APP_MODE\` | 否 | 运行模式，\`local\`（默认）启用完整功能，\`cloud\` 用于云端演示 |

## 构建命令

| 命令 | 说明 |
|------|------|
| \`npm run dev\` | 启动本地开发服务器 |
| \`npm run build\` | 构建本地部署版本 |
| \`npm run build:cloud\` | 构建 EdgeOne Makers 云端部署版本 |
| \`npm run package:local\` | 生成本地安装包 \`agent-local-package.zip\` |

构建产物将输出到 \`dist/\` 目录。
`;

zip.addFile('INSTALL.md', Buffer.from(installMd, 'utf-8'));
added.add('INSTALL.md');

zip.writeZip(outputPath);

const stats = fs.statSync(outputPath);
console.log(`打包完成: ${outputPath}`);
console.log(`文件大小: ${formatBytes(stats.size)}`);
console.log('包含内容:');
for (const item of Array.from(added).sort()) {
  console.log(`  - ${item}`);
}
