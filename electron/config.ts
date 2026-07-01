import Store from 'electron-store';
import { ipcMain } from 'electron';

interface DesktopConfig {
  aiGatewayApiKey: string;
  aiGatewayBaseUrl: string;
  aiGatewayModel: string;
  dsparkEndpoint: string;
  dsparkApiKey: string;
  dsparkDefaultCluster: string;
}

const store = new Store<DesktopConfig>({
  defaults: {
    aiGatewayApiKey: '',
    aiGatewayBaseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    aiGatewayModel: '@makers/deepseek-v4-flash',
    dsparkEndpoint: '',
    dsparkApiKey: '',
    dsparkDefaultCluster: '',
  },
});

export function getDesktopConfig(): DesktopConfig {
  return store.store;
}

export function setDesktopConfig(config: Partial<DesktopConfig>): void {
  store.set(config);
}

export function registerConfigIpc(): void {
  ipcMain.handle('config:get', () => getDesktopConfig());
  ipcMain.handle('config:set', (_event, config) => {
    setDesktopConfig(config);
    return true;
  });
}
