export interface MNNConfig {
  modelPath: string;
  backend: 'cpu' | 'gpu' | 'wasm';
  inputShape: number[];
  cacheKey?: string;
}

export interface MNNInferenceResult {
  output: unknown;
  backend: string;
  latencyMs: number;
}

export class MNNError extends Error {
  constructor(
    message: string,
    public readonly code: 'NOT_SUPPORTED' | 'MODEL_MISSING' | 'RUNTIME_ERROR',
    public readonly detail?: string,
  ) {
    super(message);
    this.name = 'MNNError';
  }
}

// 内置默认配置
const DEFAULT_CONFIG: MNNConfig = {
  modelPath: './models/default.mnn',
  backend: 'cpu',
  inputShape: [1, 224, 224, 3],
};

const sessionCache = new Map<string, unknown>();

function detectBackend(): MNNConfig['backend'] {
  if (typeof process !== 'undefined' && process.versions?.node) {
    return 'cpu';
  }
  if (typeof window !== 'undefined' && (window as unknown as { WebAssembly?: unknown }).WebAssembly) {
    return 'wasm';
  }
  throw new MNNError('MNN is not supported in this environment', 'NOT_SUPPORTED');
}

export async function createMNNSession(options?: Partial<MNNConfig>): Promise<MNNConfig> {
  const cacheKey = options?.cacheKey ?? DEFAULT_CONFIG.modelPath;
  const config: MNNConfig = {
    ...DEFAULT_CONFIG,
    ...options,
    backend: options?.backend ?? detectBackend(),
    cacheKey,
  };

  if (sessionCache.has(cacheKey)) {
    return config;
  }

  // 当前阶段为占位实现：不加载真实 MNN 后端
  // 后续可通过动态 import('@alibaba/mnn') 或 WASM 接入真实推理
  sessionCache.set(cacheKey, { config, loadedAt: Date.now() });
  return config;
}

export async function runInference(
  input: unknown,
  options?: Partial<MNNConfig>,
): Promise<MNNInferenceResult> {
  const config = await createMNNSession(options);

  const start = performance.now();

  // 占位：模拟预处理、推理、后处理
  // 真实实现中这里会调用 MNN 后端
  const output = {
    result: `[MNN placeholder inference] input=${JSON.stringify(input).slice(0, 200)}`,
    model: config.modelPath,
  };

  const latencyMs = Math.round(performance.now() - start);

  return {
    output,
    backend: config.backend,
    latencyMs,
  };
}
