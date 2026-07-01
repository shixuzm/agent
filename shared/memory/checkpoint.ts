import { MemoryStore } from './store.js';

export function loadCheckpoint(store: MemoryStore, conversationId: string): string | null {
  return store.getCheckpoint(conversationId);
}

export function saveCheckpoint(store: MemoryStore, conversationId: string, content: string): void {
  store.setCheckpoint(conversationId, content);
}

export function deleteCheckpoint(store: MemoryStore, conversationId: string): void {
  store.deleteCheckpoint(conversationId);
}
