import { app, BrowserWindow } from 'electron';
import path from 'path';
import { registerConfigIpc } from './config';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // 加载前端构建产物
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

app.whenReady().then(() => {
  // 注册桌面端配置 IPC（config:get / config:set），
  // 前端可通过 window.electronAPI 读写 electron-store 持久化配置。
  registerConfigIpc();

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
