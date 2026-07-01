#!/usr/bin/env node
/**
 * 构建鸿蒙应用工程
 * 1. 构建前端产物（VITE_DIRECT_LLM=true）
 * 2. 复制 dist/ 到 harmony/entry/src/main/resources/rawfile/
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const HARMONY_RAWFILE = path.join(ROOT, 'harmony', 'entry', 'src', 'main', 'resources', 'rawfile');

console.log('[build:harmony] Step 1: Building frontend with VITE_DIRECT_LLM=true...');
try {
  execSync('npx cross-env VITE_DIRECT_LLM=true vite build', {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, VITE_DIRECT_LLM: 'true' }
  });
} catch (e) {
  console.error('[build:harmony] Frontend build failed');
  process.exit(1);
}

console.log('[build:harmony] Step 2: Copying dist/ to harmony rawfile...');
// 确保 rawfile 目录存在
fs.mkdirSync(HARMONY_RAWFILE, { recursive: true });

// 清空 rawfile 目录中的旧文件
const existing = fs.readdirSync(HARMONY_RAWFILE);
for (const f of existing) {
  const fp = path.join(HARMONY_RAWFILE, f);
  if (fs.statSync(fp).isDirectory()) {
    fs.rmSync(fp, { recursive: true });
  } else {
    fs.unlinkSync(fp);
  }
}

// 复制 dist/ 到 rawfile/
const distDir = path.join(ROOT, 'dist');
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
copyDir(distDir, HARMONY_RAWFILE);

console.log('[build:harmony] Done! Output: harmony/entry/src/main/resources/rawfile/');
console.log('[build:harmony] Open the harmony/ directory in DevEco Studio to build the HAP.');
