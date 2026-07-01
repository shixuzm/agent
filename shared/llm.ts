import OpenAI from 'openai';
import type { ModelConfig } from './types';
import { mergeEnvWithProvider } from './configProvider';

const DEFAULT_MODEL = '@makers/deepseek-v4-flash';

export function createLLMClient(env: Record<string, string | undefined>, config?: ModelConfig): OpenAI {
  if (config?.provider === 'custom' && config.baseUrl) {
    return new OpenAI({
      apiKey: config.apiKey ?? env.AI_GATEWAY_API_KEY,
      baseURL: config.baseUrl,
    });
  }

  return new OpenAI({
    apiKey: env.AI_GATEWAY_API_KEY,
    baseURL: env.AI_GATEWAY_BASE_URL,
  });
}

export function resolveModelId(env: Record<string, string | undefined>, config?: ModelConfig): string {
  if (config?.modelId) return config.modelId;
  if (env.AI_GATEWAY_MODEL) return env.AI_GATEWAY_MODEL;
  return DEFAULT_MODEL;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function chatCompletion(
  env: Record<string, string | undefined>,
  messages: ChatMessage[],
  config?: ModelConfig,
): Promise<string> {
  // 合并 env 与 appConfigProvider 注入的配置，provider 优先级更高
  const mergedEnv = mergeEnvWithProvider(env);
  const client = createLLMClient(mergedEnv, config);
  const model = resolveModelId(mergedEnv, config);

  const res = await client.chat.completions.create({
    model,
    messages,
    temperature: config?.temperature ?? 0.7,
    max_tokens: config?.maxTokens ?? 2048,
  });

  return res.choices[0]?.message?.content ?? '';
}
