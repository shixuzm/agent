import { MemoryStore } from '../shared/memory/store.js';
import { loadCheckpoint, saveCheckpoint } from '../shared/memory/checkpoint.js';
import { loadTaskProgress, appendTaskProgress } from '../shared/memory/tasks.js';
import { loadNotes, appendNote } from '../shared/memory/notes.js';

async function runTests() {
  const store = await MemoryStore.create({ path: ':memory:' });

  if (!store.isEnabled()) {
    throw new Error('MemoryStore should be enabled in Node.js');
  }

  console.log('✓ MemoryStore enabled');

  // add
  const note = store.addMemory({
    type: 'note',
    scope: 'global',
    title: 'Shopping list',
    content: 'Buy milk, eggs and bread',
  });
  const project = store.addMemory({
    type: 'project',
    scope: 'conv-1',
    title: 'Project Alpha',
    content: 'Build a reusable SQLite memory module with full-text search',
  });
  console.log('✓ Added 2 memories:', note.id, project.id);

  // search (FTS5)
  const searchResults = store.searchMemories('SQLite full text');
  if (searchResults.length !== 1 || searchResults[0].memory.id !== project.id) {
    throw new Error(`FTS5 search failed: expected 1 result, got ${searchResults.length}`);
  }
  console.log('✓ FTS5 search returned correct result:', searchResults[0].memory.title);

  // update
  const updated = store.updateMemory(note.id, { content: 'Buy milk, eggs, bread and butter' });
  if (!updated || updated.content !== 'Buy milk, eggs, bread and butter') {
    throw new Error('updateMemory failed');
  }
  console.log('✓ updateMemory works');

  // stats
  const stats = store.getStats();
  if (stats.total !== 2) {
    throw new Error(`Expected total 2, got ${stats.total}`);
  }
  if (stats.byType.note !== 1 || stats.byType.project !== 1) {
    throw new Error(`Unexpected byType stats: ${JSON.stringify(stats.byType)}`);
  }
  console.log('✓ Stats:', stats);

  // delete
  const deleted = store.deleteMemory(note.id);
  if (!deleted) {
    throw new Error('deleteMemory returned false');
  }
  if (store.searchMemories('milk').length !== 0) {
    throw new Error('Deleted memory still appears in search');
  }
  console.log('✓ deleteMemory works');

  // clear
  store.clearAll();
  const afterClear = store.getStats();
  if (afterClear.total !== 0) {
    throw new Error(`Expected 0 memories after clear, got ${afterClear.total}`);
  }
  console.log('✓ clearAll works');

  // checkpoint
  saveCheckpoint(store, 'conv-1', 'checkpoint-content-1');
  const checkpoint = loadCheckpoint(store, 'conv-1');
  if (checkpoint !== 'checkpoint-content-1') {
    throw new Error(`Checkpoint mismatch: ${checkpoint}`);
  }
  console.log('✓ Checkpoint save/load works');

  // task progress
  appendTaskProgress(store, 'task-1', 'started');
  appendTaskProgress(store, 'task-1', 'completed step 1');
  const progress = loadTaskProgress(store, 'task-1');
  if (!progress.includes('started') || !progress.includes('completed step 1')) {
    throw new Error(`Task progress mismatch: ${progress}`);
  }
  console.log('✓ Task progress append/load works');

  // notes
  appendNote(store, 'first note');
  appendNote(store, 'second note');
  const notes = loadNotes(store);
  if (!notes.includes('first note') || !notes.includes('second note')) {
    throw new Error(`Notes mismatch: ${notes}`);
  }
  console.log('✓ Notes append/load works');

  console.log('\nAll memory tests passed.');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
