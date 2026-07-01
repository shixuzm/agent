import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (config: unknown) => ipcRenderer.invoke('config:set', config),
  getMemoryStats: () => ipcRenderer.invoke('memory:stats'),
  clearAllMemories: () => ipcRenderer.invoke('memory:clear'),
  platform: process.platform,
});
