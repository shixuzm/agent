interface ImportMetaEnv {
  readonly VITE_APP_MODE?: string;
  readonly VITE_DIRECT_LLM?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

/**
 * Electron 桌面端通过 preload 暴露的 API（仅当运行在 Electron 环境时存在）。
 * Web/移动端不存在此对象，访问前需做存在性判断。
 */
interface ElectronAPI {
  getConfig: () => Promise<unknown>;
  setConfig: (config: unknown) => Promise<boolean>;
  platform: string;
}

interface Window {
  electronAPI?: ElectronAPI;
}
