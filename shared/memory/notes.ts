import { MemoryStore } from './store.js';

export const NOTES_SCOPE = 'global';
export const NOTES_ID_MARKER = 'user-notes';
export const NOTES_TITLE = `User notes (${NOTES_ID_MARKER})`;

function findNotesMemory(store: MemoryStore) {
  const results = store.searchMemories(NOTES_ID_MARKER, {
    type: 'note',
    scope: NOTES_SCOPE,
    limit: 1,
  });
  return results[0]?.memory ?? null;
}

export function loadNotes(store: MemoryStore): string {
  return findNotesMemory(store)?.content ?? '';
}

export function appendNote(store: MemoryStore, note: string): void {
  const existing = findNotesMemory(store);
  const timestamp = new Date().toISOString();

  if (existing) {
    const updated = `${existing.content}\n[${timestamp}] ${note}`;
    store.updateMemory(existing.id, { content: updated });
  } else {
    store.addMemory({
      type: 'note',
      scope: NOTES_SCOPE,
      title: NOTES_TITLE,
      content: `[${timestamp}] ${note}`,
    });
  }
}
