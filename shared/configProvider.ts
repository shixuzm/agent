/**
 * 应用配置提供器：允许前端在运行时注入 env 配置，
 * 避免 shared 模块直接依赖前端的 localStorage 实现。
 *
 * shared 中的 llm.ts、dspark.ts、store.ts 都通过 `getEnvFromProvider()`
 * 合并 env，使得前端在浏览器环境（无 process.env）下也能使用应用内配置。
 */

type EnvProvider = () => Record<string, string | undefined>;

let provider: EnvProvider | null = null;

/**
 * 注入 env 提供器。前端入口（如 main.tsx）应在应用启动时调用一次。
 */
export function setEnvProvider(p: EnvProvider): void {
  provider = p;
}

/**
 * 从已注入的提供器中读取 env 配置。
 * 若未注入或提供器抛错，返回空对象。
 */
export function getEnvFromProvider(): Record<string, string | undefined> {
  if (!provider) return {};
  try {
    return provider() ?? {};
  } catch {
    return {};
  }
}

/**
 * 将传入的 env 与提供器返回的 env 合并。
 * 提供器返回的值优先级高于传入的 env（用于覆盖服务端默认配置）。
 */
export function mergeEnvWithProvider(env: Record<string, string | undefined>): Record<string, string | undefined> {
  return { ...env, ...getEnvFromProvider() };
}
