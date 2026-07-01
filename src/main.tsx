import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setEnvProvider } from '../shared/configProvider';
import { appConfigToEnv, getAppConfig } from './lib/appConfig';

// 注入应用内配置提供器，使 shared 模块在浏览器环境下也能读取 localStorage 中的配置。
// provider 优先级高于传入的 env，因此用户在前端保存的配置会覆盖服务端默认值。
setEnvProvider(() => appConfigToEnv(getAppConfig()));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
