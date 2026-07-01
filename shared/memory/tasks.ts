import { MemoryStore } from './store.js';

function taskMemoryTitle(taskId: string): string {
  return `Task progress: ${taskId}`;
}

export function loadTaskProgress(store: MemoryStore, taskId: string): string {
  const results = store.searchMemories(taskId, {
    type: 'task',
    scope: taskId,
    limit: 1,
  });
  return results[0]?.memory.content ?? '';
}

export function appendTaskProgress(store: MemoryStore, taskId: string, entry: string): void {
  const existing = loadTaskProgress(store, taskId);
  const timestamp = new Date().toISOString();
  const updated = existing ? `${existing}\n[${timestamp}] ${entry}` : `[${timestamp}] ${entry}`;

  const results = store.searchMemories(taskId, {
    type: 'task',
    scope: taskId,
    limit: 1,
  });

  if (results.length > 0) {
    store.updateMemory(results[0].memory.id, { content: updated });
  } else {
    store.addMemory({
      type: 'task',
      scope: taskId,
      title: taskMemoryTitle(taskId),
      content: updated,
    });
  }
}
