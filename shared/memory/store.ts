import { createMemoryDb, CreateMemoryDbOptions, SqliteEngine } from './sqlite.js';
import { Memory, MemoryType, SearchResult, MemoryStats } from './types.js';

export type { SearchResult } from './types.js';

export interface MemoryStoreCreateOptions extends CreateMemoryDbOptions {
  syncDir?: string;
}

function isNodeFileSystemAvailable(): boolean {
  return (
    typeof process !== 'undefined' &&
    typeof process.versions === 'object' &&
    process.versions.node != null
  );
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS memories (
  row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'global',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
  title,
  content,
  content='memories',
  content_rowid='row_id'
);

CREATE TABLE IF NOT EXISTS checkpoints (
  conversation_id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TRIGGER IF NOT EXISTS memories_fts_insert AFTER INSERT ON memories BEGIN
  INSERT INTO memories_fts(rowid, title, content) VALUES (new.row_id, new.title, new.content);
END;

CREATE TRIGGER IF NOT EXISTS memories_fts_update AFTER UPDATE ON memories BEGIN
  UPDATE memories_fts SET title = new.title, content = new.content WHERE rowid = new.row_id;
END;

CREATE TRIGGER IF NOT EXISTS memories_fts_delete AFTER DELETE ON memories BEGIN
  DELETE FROM memories_fts WHERE rowid = old.row_id;
END;
`;

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function now(): number {
  return Date.now();
}

function sanitizeFtsQuery(query: string): string {
  return query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => `"${token.replace(/"/g, '""')}"`)
    .join(' ');
}

function rowToMemory(row: Record<string, unknown>): Memory {
  return {
    id: row.id as string,
    type: row.type as MemoryType,
    scope: row.scope as string,
    title: row.title as string,
    content: row.content as string,
    metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined,
    createdAt: row.created_at as number,
    updatedAt: row.updated_at as number,
  };
}

export class MemoryStore {
  private db: SqliteEngine | null = null;
  private enabled = false;
  private syncDir?: string;
  private initialized = false;
  private exportPending = false;

  private constructor() {}

  static async create(options?: MemoryStoreCreateOptions): Promise<MemoryStore> {
    const store = new MemoryStore();
    try {
      store.db = await createMemoryDb(options);
      store.db.exec(SCHEMA);
      store.enabled = true;

      if (options?.syncDir && isNodeFileSystemAvailable()) {
        store.syncDir = options.syncDir;
        await store.initSync();
      }

      store.initialized = true;
    } catch (e) {
      console.warn('Memory persistence disabled:', e);
      store.db = null;
      store.enabled = false;
      store.initialized = true;
    }
    return store;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private async initSync(): Promise<void> {
    if (!this.syncDir) return;
    try {
      const { initSync } = await import('./sync.js');
      await initSync(this, this.syncDir);
    } catch (e) {
      console.warn('Memory init sync failed:', e);
    }
  }

  private scheduleExport(): void {
    if (!this.syncDir || !this.initialized || this.exportPending) return;
    this.exportPending = true;
    setTimeout(() => {
      this.exportPending = false;
      if (!this.syncDir) return;
      import('./sync.js')
        .then(({ exportSync }) => exportSync(this, this.syncDir!))
        .catch((e) => console.warn('Memory export sync failed:', e));
    }, 0);
  }

  addMemory(memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>): Memory {
    if (!this.enabled || !this.db) {
      throw new Error('MemoryStore is not enabled');
    }

    const id = generateId();
    const timestamp = now();
    const newMemory: Memory = {
      ...memory,
      id,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.db
      .prepare(
        `INSERT INTO memories (id, type, scope, title, content, metadata, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        newMemory.id,
        newMemory.type,
        newMemory.scope,
        newMemory.title,
        newMemory.content,
        newMemory.metadata ? JSON.stringify(newMemory.metadata) : null,
        newMemory.createdAt,
      newMemory.updatedAt
    );

    this.scheduleExport();
    return newMemory;
  }

  updateMemory(
    id: string,
    updates: Partial<Omit<Memory, 'id' | 'createdAt'>>
  ): Memory | null {
    if (!this.enabled || !this.db) {
      throw new Error('MemoryStore is not enabled');
    }

    const existing = this.getMemoryById(id);
    if (!existing) return null;

    const updated: Memory = {
      ...existing,
      ...updates,
      metadata:
        updates.metadata === undefined
          ? existing.metadata
          : updates.metadata,
      updatedAt: now(),
    };

    this.db
      .prepare(
        `UPDATE memories
         SET type = ?, scope = ?, title = ?, content = ?, metadata = ?, updated_at = ?
         WHERE id = ?`
      )
      .run(
        updated.type,
        updated.scope,
        updated.title,
        updated.content,
        updated.metadata ? JSON.stringify(updated.metadata) : null,
        updated.updatedAt,
        id
    );

    this.scheduleExport();
    return updated;
  }

  getMemoryById(id: string): Memory | null {
    if (!this.db) return null;
    const row = this.db
      .prepare('SELECT * FROM memories WHERE id = ?')
      .get(id) as Record<string, unknown> | undefined;
    return row ? rowToMemory(row) : null;
  }

  getMemoriesByType(type: MemoryType): Memory[] {
    if (!this.enabled || !this.db) return [];
    const rows = this.db
      .prepare('SELECT * FROM memories WHERE type = ? ORDER BY updated_at')
      .all(type) as Array<Record<string, unknown>>;
    return rows.map(rowToMemory);
  }

  getAllCheckpoints(): Array<{ conversationId: string; content: string; updatedAt: number }> {
    if (!this.enabled || !this.db) return [];
    const rows = this.db
      .prepare('SELECT conversation_id, content, updated_at FROM checkpoints ORDER BY updated_at')
      .all() as Array<Record<string, unknown>>;
    return rows.map((row) => ({
      conversationId: row.conversation_id as string,
      content: row.content as string,
      updatedAt: row.updated_at as number,
    }));
  }

  searchMemories(
    query: string,
    options: { type?: MemoryType; scope?: string; limit?: number } = {}
  ): SearchResult[] {
    if (!this.enabled || !this.db || !query.trim()) {
      return [];
    }

    const limit = options.limit ?? 20;
    const safeQuery = sanitizeFtsQuery(query);
    const params: unknown[] = [safeQuery];

    let sql = `SELECT m.*, rank FROM memories_fts f
               JOIN memories m ON m.row_id = f.rowid
               WHERE memories_fts MATCH ?`;

    if (options.type) {
      sql += ' AND m.type = ?';
      params.push(options.type);
    }
    if (options.scope) {
      sql += ' AND m.scope = ?';
      params.push(options.scope);
    }

    sql += ' ORDER BY rank LIMIT ?';
    params.push(limit);

    const rows = this.db.prepare(sql).all(...params) as Array<Record<string, unknown>>;
    return rows.map((row) => ({
      memory: rowToMemory(row),
      rank: row.rank as number,
    }));
  }

  deleteMemory(id: string): boolean {
    if (!this.enabled || !this.db) return false;

    const info = this.db.prepare('DELETE FROM memories WHERE id = ?').run(id);
    // better-sqlite3 run returns { changes: number }; sql.js returns undefined
    const changed = (info as { changes?: number } | undefined)?.changes !== 0;
    if (changed) this.scheduleExport();
    return changed;
  }

  clearAll(): void {
    if (!this.enabled || !this.db) return;

    this.db.exec('DELETE FROM memories');
    this.db.exec('DELETE FROM checkpoints');
    this.scheduleExport();
  }

  getStats(): MemoryStats {
    const emptyByType: Record<MemoryType, number> = {
      project: 0,
      checkpoint: 0,
      note: 0,
      task: 0,
      generic: 0,
    };

    if (!this.enabled || !this.db) {
      return { total: 0, byType: { ...emptyByType }, sizeBytes: 0 };
    }

    const total = (this.db.prepare('SELECT COUNT(*) AS c FROM memories').get() as { c: number }).c;
    const typeRows = this.db
      .prepare('SELECT type, COUNT(*) AS c FROM memories GROUP BY type')
      .all() as Array<{ type: MemoryType; c: number }>;

    const byType = { ...emptyByType };
    for (const row of typeRows) {
      byType[row.type] = row.c;
    }

    const sizeRow = this.db
      .prepare(
        `SELECT SUM(LENGTH(id) + LENGTH(type) + LENGTH(scope) + LENGTH(title) + LENGTH(content) + IFNULL(LENGTH(metadata), 0)) AS s FROM memories`
      )
      .get() as { s: number | null } | undefined;
    const sizeBytes = sizeRow?.s ?? 0;

    return { total, byType, sizeBytes };
  }

  // Internal helpers used by checkpoint / task / note modules
  getCheckpoint(conversationId: string): string | null {
    if (!this.enabled || !this.db) return null;
    const row = this.db
      .prepare('SELECT content FROM checkpoints WHERE conversation_id = ?')
      .get(conversationId) as { content: string } | undefined;
    return row?.content ?? null;
  }

  setCheckpoint(conversationId: string, content: string): void {
    if (!this.enabled || !this.db) return;
    this.db
      .prepare(
        `INSERT INTO checkpoints (conversation_id, content, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(conversation_id) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at`
      )
      .run(conversationId, content, now());
    this.scheduleExport();
  }

  deleteCheckpoint(conversationId: string): void {
    if (!this.enabled || !this.db) return;
    this.db.prepare('DELETE FROM checkpoints WHERE conversation_id = ?').run(conversationId);
    this.scheduleExport();
  }
}

let globalStorePromise: Promise<MemoryStore> | null = null;

/**
 * Lazily-initialized global memory store. Because SQLite engines may require
 * async initialization (sql.js WASM), this is exposed as a Promise.
 */
export function getGlobalMemoryStore(options?: MemoryStoreCreateOptions): Promise<MemoryStore> {
  if (!globalStorePromise) {
    const syncDir = isNodeFileSystemAvailable() ? process.cwd() : undefined;
    globalStorePromise = MemoryStore.create({ ...options, syncDir });
  }
  return globalStorePromise;
}
