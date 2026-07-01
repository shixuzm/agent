import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (config: unknown) => ipcRenderer.invoke('config:set', config),
  platform: process.platform,
});
