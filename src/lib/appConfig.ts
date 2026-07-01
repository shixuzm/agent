export interface AppConfig {
  aiGatewayApiKey: string;
  aiGatewayBaseUrl: string;
  aiGatewayModel: string;
  dsparkEndpoint: string;
  dsparkApiKey: string;
  dsparkDefaultCluster: string;
}

const STORAGE_KEY = 'app_settings';

/**
 * 从 localStorage 读取应用配置。
 * 在 SSR 或无 localStorage 环境下返回 null。
 */
export function getAppConfig(): AppConfig | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AppConfig>;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      aiGatewayApiKey: parsed.aiGatewayApiKey ?? '',
      aiGatewayBaseUrl: parsed.aiGatewayBaseUrl ?? '',
      aiGatewayModel: parsed.aiGatewayModel ?? '',
      dsparkEndpoint: parsed.dsparkEndpoint ?? '',
      dsparkApiKey: parsed.dsparkApiKey ?? '',
      dsparkDefaultCluster: parsed.dsparkDefaultCluster ?? '',
    };
  } catch {
    return null;
  }
}

/**
 * 保存应用配置到 localStorage。
 */
export function setAppConfig(config: AppConfig): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // 忽略写入失败（隐私模式、配额超限等）
  }
}

/**
 * 检查是否已配置（至少 aiGatewayApiKey 不为空）。
 */
export function hasAppConfig(): boolean {
  const config = getAppConfig();
  return !!config && config.aiGatewayApiKey.trim().length > 0;
}

/**
 * 清除应用配置。
 */
export function clearAppConfig(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 忽略删除失败
  }
}

/**
 * 将 AppConfig 转换为 env 格式（Record<string, string | undefined>），
 * 方便 shared 模块使用。config 为 null 时返回空对象。
 */
export function appConfigToEnv(config: AppConfig | null): Record<string, string | undefined> {
  if (!config) return {};
  return {
    AI_GATEWAY_API_KEY: config.aiGatewayApiKey || undefined,
    AI_GATEWAY_BASE_URL: config.aiGatewayBaseUrl || undefined,
    AI_GATEWAY_MODEL: config.aiGatewayModel || undefined,
    DSPARK_ENDPOINT: config.dsparkEndpoint || undefined,
    DSPARK_API_KEY: config.dsparkApiKey || undefined,
    DSPARK_DEFAULT_CLUSTER: config.dsparkDefaultCluster || undefined,
  };
}
