import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { MemoryStore } from '../shared/memory/store.js';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'memory-sync-'));

  // Pre-seed Markdown files
  fs.writeFileSync(
    path.join(tmpDir, 'MEMORY.md'),
    '# Project Memory\n\n## Project Rules\n- Always write tests\n- Never commit secrets\n\n## Architecture Decisions\n- Use SQLite + FTS5 for search\n'
  );
  fs.writeFileSync(
    path.join(tmpDir, 'notes.md'),
    '# User Notes\n\n## User Notes\n- [2024-01-01T00:00:00.000Z] First note\n- [2024-01-02T00:00:00.000Z] Second note\n'
  );
  fs.mkdirSync(path.join(tmpDir, 'tasks', 'task-abc'), { recursive: true });
  fs.writeFileSync(
    path.join(tmpDir, 'tasks', 'task-abc', 'progress.md'),
    '# Task Progress\n\n## Progress\n- [2024-01-01T00:00:00.000Z] started\n- [2024-01-01T01:00:00.000Z] done\n'
  );
  fs.writeFileSync(path.join(tmpDir, 'checkpoint.md'), '# Checkpoint\n\nActive checkpoint content');

  // 1. initSync imports Markdown into SQLite
  const store = await MemoryStore.create({ path: ':memory:', syncDir: tmpDir });

  const projects = store.getMemoriesByType('project');
  if (projects.length !== 3) {
    throw new Error(`Expected 3 project memories, got ${projects.length}`);
  }
  console.log('✓ Imported project memories:', projects.map((m) => m.content));

  const notes = store.getMemoriesByType('note');
  if (notes.length !== 1 || !notes[0].content.includes('First note')) {
    throw new Error('Note import failed');
  }
  console.log('✓ Imported notes');

  const tasks = store.getMemoriesByType('task');
  if (tasks.length !== 1 || !tasks[0].content.includes('started')) {
    throw new Error('Task import failed');
  }
  console.log('✓ Imported task progress');

  const checkpoint = store.getCheckpoint('active');
  if (checkpoint !== 'Active checkpoint content') {
    throw new Error(`Checkpoint import failed: ${checkpoint}`);
  }
  console.log('✓ Imported checkpoint');

  // 2. Write operations export back to Markdown
  store.addMemory({
    type: 'project',
    scope: 'global',
    title: 'Project Rules',
    content: 'Run CI on every PR',
  });
  const existingNote = store.getMemoriesByType('note')[0];
  store.updateMemory(existingNote.id, {
    content: `${existingNote.content}\n[2024-01-03T00:00:00.000Z] Third note`,
  });

  await wait(100);

  const memoryMd = fs.readFileSync(path.join(tmpDir, 'MEMORY.md'), 'utf-8');
  if (!memoryMd.includes('Run CI on every PR')) {
    throw new Error('MEMORY.md export missing new project memory');
  }
  console.log('✓ Exported MEMORY.md');

  const notesMd = fs.readFileSync(path.join(tmpDir, 'notes.md'), 'utf-8');
  if (!notesMd.includes('Third note')) {
    throw new Error('notes.md export missing new note');
  }
  console.log('✓ Exported notes.md');

  // 3. Re-import into a fresh store to verify round-trip stability
  const store2 = await MemoryStore.create({ path: ':memory:', syncDir: tmpDir });
  const projects2 = store2.getMemoriesByType('project').filter((m) => m.scope === 'global');
  if (projects2.length !== 4) {
    throw new Error(`Expected 4 project memories after round-trip, got ${projects2.length}`);
  }
  const notes2 = store2.getMemoriesByType('note');
  if (notes2.length !== 1 || !notes2[0].content.includes('Third note')) {
    throw new Error('Note round-trip failed');
  }
  console.log('✓ Round-trip sync stable');

  // cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log('\nAll memory sync tests passed.');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
