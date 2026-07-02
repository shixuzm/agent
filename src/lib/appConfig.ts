export interface AppConfig {
  aiGatewayApiKey: string;
  aiGatewayBaseUrl: string;
  aiGatewayModel: string;
  // Context management
  contextWindow?: number;
  checkpointThreshold?: number;
  rebuildThreshold?: number;
  recentMessagesRatio?: number;
  memoryRatio?: number;
  taskProgressRatio?: number;
}

const STORAGE_KEY = 'app_settings';

const DEFAULT_CONFIG: AppConfig = {
  aiGatewayApiKey: '',
  aiGatewayBaseUrl: '',
  aiGatewayModel: '',
  contextWindow: 32000,
  checkpointThreshold: 0.55,
  rebuildThreshold: 0.80,
  recentMessagesRatio: 0.45,
  memoryRatio: 0.10,
  taskProgressRatio: 0.10,
};

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
      ...DEFAULT_CONFIG,
      ...parsed,
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
    CONTEXT_WINDOW: config.contextWindow !== undefined ? String(config.contextWindow) : undefined,
    CHECKPOINT_THRESHOLD: config.checkpointThreshold !== undefined ? String(config.checkpointThreshold) : undefined,
    REBUILD_THRESHOLD: config.rebuildThreshold !== undefined ? String(config.rebuildThreshold) : undefined,
    RECENT_MESSAGES_RATIO: config.recentMessagesRatio !== undefined ? String(config.recentMessagesRatio) : undefined,
    MEMORY_RATIO: config.memoryRatio !== undefined ? String(config.memoryRatio) : undefined,
    TASK_PROGRESS_RATIO: config.taskProgressRatio !== undefined ? String(config.taskProgressRatio) : undefined,
  };
}
