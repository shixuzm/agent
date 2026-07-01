import { mergeEnvWithProvider } from './configProvider';

export interface DSparkClientConfig {
  endpoint: string;
  apiKey?: string;
  defaultCluster?: string;
}

export interface DSparkJob {
  id: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  result?: unknown;
  error?: string;
}

export interface DSparkClient {
  submitJob(sqlOrScript: string, options?: { cluster?: string; params?: Record<string, unknown> }): Promise<{ jobId: string }>;
  getJobStatus(jobId: string): Promise<DSparkJob>;
  getJobResult(jobId: string): Promise<unknown>;
}

export class DSparkError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly responseText: string,
  ) {
    super(message);
    this.name = 'DSparkError';
  }
}

const clientCache = new Map<string, DSparkClient>();

function buildKey(env: Record<string, string | undefined>): string {
  return `${env.DSPARK_ENDPOINT ?? ''}:${env.DSPARK_API_KEY ?? ''}:${env.DSPARK_DEFAULT_CLUSTER ?? ''}`;
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const text = await response.text();
    throw new DSparkError(
      `DSpark request failed: ${response.status} ${response.statusText}`,
      response.status,
      text,
    );
  }
  return response.json() as Promise<T>;
}

export function createDSparkClient(env: Record<string, string | undefined>): DSparkClient {
  // 合并 env 与 appConfigProvider 注入的配置，provider 优先级更高
  const mergedEnv = mergeEnvWithProvider(env);
  const cached = clientCache.get(buildKey(mergedEnv));
  if (cached) {
    return cached;
  }

  const endpoint = mergedEnv.DSPARK_ENDPOINT;
  if (!endpoint) {
    throw new Error('DSpark client not configured: missing DSPARK_ENDPOINT');
  }

  const apiKey = mergedEnv.DSPARK_API_KEY;
  const defaultCluster = mergedEnv.DSPARK_DEFAULT_CLUSTER;

  const client: DSparkClient = {
    async submitJob(sqlOrScript, options) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headers.Authorization = `Bearer ${apiKey}`;
      }

      const body = {
        sqlOrScript,
        cluster: options?.cluster ?? defaultCluster,
        params: options?.params,
      };

      return request<{ jobId: string }>(`${endpoint}/jobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
    },

    async getJobStatus(jobId) {
      const headers: Record<string, string> = {};
      if (apiKey) {
        headers.Authorization = `Bearer ${apiKey}`;
      }

      return request<DSparkJob>(`${endpoint}/jobs/${jobId}/status`, {
        method: 'GET',
        headers,
      });
    },

    async getJobResult(jobId) {
      const headers: Record<string, string> = {};
      if (apiKey) {
        headers.Authorization = `Bearer ${apiKey}`;
      }

      return request<unknown>(`${endpoint}/jobs/${jobId}/result`, {
        method: 'GET',
        headers,
      });
    },
  };

  clientCache.set(buildKey(mergedEnv), client);
  return client;
}
