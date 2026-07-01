import { MemoryStore } from './store.js';
import { Memory, MemoryType } from './types.js';
import { NOTES_TITLE } from './notes.js';

export function isFileSystemAvailable(): boolean {
  return (
    typeof process !== 'undefined' &&
    typeof process.versions === 'object' &&
    process.versions.node != null
  );
}

interface ParsedSection {
  title: string;
  items: string[];
}

async function hashInput(input: string): Promise<string> {
  const { createHash } = await import('node:crypto');
  return createHash('sha256').update(input).digest('hex').slice(0, 12);
}

async function stableMemoryId(
  type: MemoryType,
  scope: string,
  title: string
): Promise<string> {
  return hashInput(`${type}:${scope}:${title}`);
}

async function readTextFile(filePath: string): Promise<string | null> {
  if (!isFileSystemAvailable()) return null;
  const fs = await import('node:fs/promises');
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'ENOENT') return null;
    console.warn('Failed to read memory sync file:', filePath, err);
    return null;
  }
}

function parseMarkdownSections(content: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  let current: ParsedSection | null = null;

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    const headingMatch = line.match(/^##\s+(.*)$/);
    if (headingMatch) {
      current = { title: headingMatch[1].trim(), items: [] };
      sections.push(current);
      continue;
    }

    const itemMatch = line.match(/^[-*]\s+(.*)$/);
    if (itemMatch && current) {
      current.items.push(itemMatch[1].trim());
    }
  }

  return sections;
}

async function listTaskIds(tasksDir: string): Promise<string[]> {
  if (!isFileSystemAvailable()) return [];
  const fs = await import('node:fs/promises');
  try {
    const entries = (await fs.readdir(tasksDir, {
      withFileTypes: true,
    })) as Array<{ name: string; isDirectory: () => boolean }>;
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}

function isUserNotesHeading(title: string): boolean {
  return title.toLowerCase().includes('user notes') || title.toLowerCase() === 'notes';
}

function taskMemoryTitle(taskId: string): string {
  return `Task progress: ${taskId}`;
}

export async function initSync(store: MemoryStore, syncDir: string): Promise<void> {
  if (!isFileSystemAvailable()) return;

  const path = await import('node:path');
  const base = syncDir;

  // 1. MEMORY.md -> project global memories
  const memoryPath = path.join(base, 'MEMORY.md');
  const memoryContent = await readTextFile(memoryPath);
  if (memoryContent) {
    for (const section of parseMarkdownSections(memoryContent)) {
      for (const item of section.items) {
        const title = section.title;
        const content = item;
        const id = await hashInput(`${title}:${content}`);
        const existing = store.getMemoryById(id);
        if (existing) {
          if (existing.title !== title || existing.content !== content) {
            store.updateMemory(id, { title, content });
          }
        } else {
          store.addMemory({
            type: 'project',
            scope: 'global',
            title,
            content,
          });
        }
      }
    }
  }

  // 2. notes.md -> note global memories
  const notesPath = path.join(base, 'notes.md');
  const notesContent = await readTextFile(notesPath);
  if (notesContent) {
    for (const section of parseMarkdownSections(notesContent)) {
      if (section.items.length === 0) continue;
      const content = section.items.join('\n');
      const title = isUserNotesHeading(section.title) ? NOTES_TITLE : section.title;
      const id = await stableMemoryId('note', 'global', title);
      const existing = store.getMemoryById(id);
      if (existing) {
        if (existing.content !== content || existing.title !== title) {
          store.updateMemory(id, { title, content });
        }
      } else {
        store.addMemory({
          type: 'note',
          scope: 'global',
          title,
          content,
        });
      }
    }
  }

  // 3. tasks/<id>/progress.md -> task memories
  const tasksDir = path.join(base, 'tasks');
  for (const taskId of await listTaskIds(tasksDir)) {
    const progressPath = path.join(tasksDir, taskId, 'progress.md');
    const progressContent = await readTextFile(progressPath);
    if (!progressContent) continue;

    const sections = parseMarkdownSections(progressContent);
    const items = sections.flatMap((s) => s.items);
    if (items.length === 0) continue;

    const title = taskMemoryTitle(taskId);
    const content = items.join('\n');
    const id = await stableMemoryId('task', taskId, title);
    const existing = store.getMemoryById(id);
    if (existing) {
      if (existing.content !== content || existing.title !== title) {
        store.updateMemory(id, { title, content });
      }
    } else {
      store.addMemory({
        type: 'task',
        scope: taskId,
        title,
        content,
      });
    }
  }

  // 4. checkpoint.md -> active checkpoint
  const checkpointPath = path.join(base, 'checkpoint.md');
  const checkpointContent = await readTextFile(checkpointPath);
  if (checkpointContent) {
    const lines = checkpointContent.split(/\r?\n/);
    let contentStart = 0;
    if (lines[0]?.startsWith('# ')) {
      contentStart = 1;
    }
    const content = lines.slice(contentStart).join('\n').trim();
    if (content) {
      store.setCheckpoint('active', content);
    }
  }
}

export async function exportSync(store: MemoryStore, syncDir: string): Promise<void> {
  if (!isFileSystemAvailable()) return;

  const path = await import('node:path');
  const fs = await import('node:fs/promises');
  const base = syncDir;

  // 1. project global memories -> MEMORY.md
  const projects = store
    .getMemoriesByType('project')
    .filter((m) => m.scope === 'global');
  const memoryLines: string[] = ['# Project Memory', ''];
  if (projects.length === 0) {
    memoryLines.push('## Project Rules', '');
  } else {
    const groups: Record<string, Memory[]> = {};
    for (const m of projects) {
      (groups[m.title] ??= []).push(m);
    }
    for (const title of Object.keys(groups).sort()) {
      memoryLines.push(`## ${title}`);
      for (const m of groups[title].sort((a, b) => a.updatedAt - b.updatedAt)) {
        for (const line of m.content.split(/\r?\n/)) {
          const text = line.trim();
          if (!text) continue;
          memoryLines.push(`- ${text}`);
        }
      }
      memoryLines.push('');
    }
  }
  await fs.writeFile(path.join(base, 'MEMORY.md'), memoryLines.join('\n'), 'utf-8');

  // 2. note global memories -> notes.md
  const notes = store.getMemoriesByType('note').filter((m) => m.scope === 'global');
  const notesLines: string[] = ['# User Notes', ''];
  if (notes.length === 0) {
    notesLines.push('## User Notes', '');
  } else {
    for (const note of notes.sort((a, b) => a.updatedAt - b.updatedAt)) {
      const heading = note.title === NOTES_TITLE ? 'User Notes' : note.title;
      notesLines.push(`## ${heading}`);
      for (const line of note.content.split(/\r?\n/)) {
        const text = line.trim();
        if (!text) continue;
        notesLines.push(`- ${text}`);
      }
      notesLines.push('');
    }
  }
  await fs.writeFile(path.join(base, 'notes.md'), notesLines.join('\n'), 'utf-8');

  // 3. task memories -> tasks/<id>/progress.md
  const tasks = store.getMemoriesByType('task');
  const tasksDir = path.join(base, 'tasks');
  for (const task of tasks) {
    const taskDir = path.join(tasksDir, task.scope);
    await fs.mkdir(taskDir, { recursive: true });
    const lines: string[] = ['# Task Progress', '', '## Progress'];
    for (const line of task.content.split(/\r?\n/)) {
      const text = line.trim();
      if (!text) continue;
      lines.push(`- ${text}`);
    }
    lines.push('');
    await fs.writeFile(path.join(taskDir, 'progress.md'), lines.join('\n'), 'utf-8');
  }

  // 4. checkpoints -> checkpoint.md (most recent)
  const checkpoints = store.getAllCheckpoints();
  if (checkpoints.length > 0) {
    const latest = checkpoints.reduce((a, b) => (a.updatedAt > b.updatedAt ? a : b));
    await fs.writeFile(
      path.join(base, 'checkpoint.md'),
      `# Checkpoint\n\n${latest.content}`,
      'utf-8'
    );
  } else {
    await fs.writeFile(path.join(base, 'checkpoint.md'), `# Checkpoint\n\n`, 'utf-8');
  }
}
