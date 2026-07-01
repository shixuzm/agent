import { randomUUID as nodeRandomUUID } from 'crypto';

export function randomUUID(): string {
  try {
    return nodeRandomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
