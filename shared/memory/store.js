"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryStore = void 0;
exports.getGlobalMemoryStore = getGlobalMemoryStore;
const sqlite_js_1 = require("./sqlite.js");
function isNodeFileSystemAvailable() {
    return (typeof process !== 'undefined' &&
        typeof process.versions === 'object' &&
        process.versions.node != null);
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
function generateId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
function now() {
    return Date.now();
}
function sanitizeFtsQuery(query) {
    return query
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((token) => `"${token.replace(/"/g, '""')}"`)
        .join(' ');
}
function rowToMemory(row) {
    return {
        id: row.id,
        type: row.type,
        scope: row.scope,
        title: row.title,
        content: row.content,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
class MemoryStore {
    db = null;
    enabled = false;
    syncDir;
    initialized = false;
    exportPending = false;
    constructor() { }
    static async create(options) {
        const store = new MemoryStore();
        try {
            store.db = await (0, sqlite_js_1.createMemoryDb)(options);
            store.db.exec(SCHEMA);
            store.enabled = true;
            if (options?.syncDir && isNodeFileSystemAvailable()) {
                store.syncDir = options.syncDir;
                await store.initSync();
            }
            store.initialized = true;
        }
        catch (e) {
            console.warn('Memory persistence disabled:', e);
            store.db = null;
            store.enabled = false;
            store.initialized = true;
        }
        return store;
    }
    isEnabled() {
        return this.enabled;
    }
    async initSync() {
        if (!this.syncDir)
            return;
        try {
            const { initSync } = await Promise.resolve().then(() => __importStar(require('./sync.js')));
            await initSync(this, this.syncDir);
        }
        catch (e) {
            console.warn('Memory init sync failed:', e);
        }
    }
    scheduleExport() {
        if (!this.syncDir || !this.initialized || this.exportPending)
            return;
        this.exportPending = true;
        setTimeout(() => {
            this.exportPending = false;
            if (!this.syncDir)
                return;
            Promise.resolve().then(() => __importStar(require('./sync.js'))).then(({ exportSync }) => exportSync(this, this.syncDir))
                .catch((e) => console.warn('Memory export sync failed:', e));
        }, 0);
    }
    addMemory(memory) {
        if (!this.enabled || !this.db) {
            throw new Error('MemoryStore is not enabled');
        }
        const id = generateId();
        const timestamp = now();
        const newMemory = {
            ...memory,
            id,
            createdAt: timestamp,
            updatedAt: timestamp,
        };
        this.db
            .prepare(`INSERT INTO memories (id, type, scope, title, content, metadata, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
            .run(newMemory.id, newMemory.type, newMemory.scope, newMemory.title, newMemory.content, newMemory.metadata ? JSON.stringify(newMemory.metadata) : null, newMemory.createdAt, newMemory.updatedAt);
        this.scheduleExport();
        return newMemory;
    }
    updateMemory(id, updates) {
        if (!this.enabled || !this.db) {
            throw new Error('MemoryStore is not enabled');
        }
        const existing = this.getMemoryById(id);
        if (!existing)
            return null;
        const updated = {
            ...existing,
            ...updates,
            metadata: updates.metadata === undefined
                ? existing.metadata
                : updates.metadata,
            updatedAt: now(),
        };
        this.db
            .prepare(`UPDATE memories
         SET type = ?, scope = ?, title = ?, content = ?, metadata = ?, updated_at = ?
         WHERE id = ?`)
            .run(updated.type, updated.scope, updated.title, updated.content, updated.metadata ? JSON.stringify(updated.metadata) : null, updated.updatedAt, id);
        this.scheduleExport();
        return updated;
    }
    getMemoryById(id) {
        if (!this.db)
            return null;
        const row = this.db
            .prepare('SELECT * FROM memories WHERE id = ?')
            .get(id);
        return row ? rowToMemory(row) : null;
    }
    getMemoriesByType(type) {
        if (!this.enabled || !this.db)
            return [];
        const rows = this.db
            .prepare('SELECT * FROM memories WHERE type = ? ORDER BY updated_at')
            .all(type);
        return rows.map(rowToMemory);
    }
    getAllCheckpoints() {
        if (!this.enabled || !this.db)
            return [];
        const rows = this.db
            .prepare('SELECT conversation_id, content, updated_at FROM checkpoints ORDER BY updated_at')
            .all();
        return rows.map((row) => ({
            conversationId: row.conversation_id,
            content: row.content,
            updatedAt: row.updated_at,
        }));
    }
    searchMemories(query, options = {}) {
        if (!this.enabled || !this.db || !query.trim()) {
            return [];
        }
        const limit = options.limit ?? 20;
        const safeQuery = sanitizeFtsQuery(query);
        const params = [safeQuery];
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
        const rows = this.db.prepare(sql).all(...params);
        return rows.map((row) => ({
            memory: rowToMemory(row),
            rank: row.rank,
        }));
    }
    deleteMemory(id) {
        if (!this.enabled || !this.db)
            return false;
        const info = this.db.prepare('DELETE FROM memories WHERE id = ?').run(id);
        // better-sqlite3 run returns { changes: number }; sql.js returns undefined
        const changed = info?.changes !== 0;
        if (changed)
            this.scheduleExport();
        return changed;
    }
    clearAll() {
        if (!this.enabled || !this.db)
            return;
        this.db.exec('DELETE FROM memories');
        this.db.exec('DELETE FROM checkpoints');
        this.scheduleExport();
    }
    getStats() {
        const emptyByType = {
            project: 0,
            checkpoint: 0,
            note: 0,
            task: 0,
            generic: 0,
        };
        if (!this.enabled || !this.db) {
            return { total: 0, byType: { ...emptyByType }, sizeBytes: 0 };
        }
        const total = this.db.prepare('SELECT COUNT(*) AS c FROM memories').get().c;
        const typeRows = this.db
            .prepare('SELECT type, COUNT(*) AS c FROM memories GROUP BY type')
            .all();
        const byType = { ...emptyByType };
        for (const row of typeRows) {
            byType[row.type] = row.c;
        }
        const sizeRow = this.db
            .prepare(`SELECT SUM(LENGTH(id) + LENGTH(type) + LENGTH(scope) + LENGTH(title) + LENGTH(content) + IFNULL(LENGTH(metadata), 0)) AS s FROM memories`)
            .get();
        const sizeBytes = sizeRow?.s ?? 0;
        return { total, byType, sizeBytes };
    }
    // Internal helpers used by checkpoint / task / note modules
    getCheckpoint(conversationId) {
        if (!this.enabled || !this.db)
            return null;
        const row = this.db
            .prepare('SELECT content FROM checkpoints WHERE conversation_id = ?')
            .get(conversationId);
        return row?.content ?? null;
    }
    setCheckpoint(conversationId, content) {
        if (!this.enabled || !this.db)
            return;
        this.db
            .prepare(`INSERT INTO checkpoints (conversation_id, content, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(conversation_id) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at`)
            .run(conversationId, content, now());
        this.scheduleExport();
    }
    deleteCheckpoint(conversationId) {
        if (!this.enabled || !this.db)
            return;
        this.db.prepare('DELETE FROM checkpoints WHERE conversation_id = ?').run(conversationId);
        this.scheduleExport();
    }
}
exports.MemoryStore = MemoryStore;
let globalStorePromise = null;
/**
 * Lazily-initialized global memory store. Because SQLite engines may require
 * async initialization (sql.js WASM), this is exposed as a Promise.
 */
function getGlobalMemoryStore(options) {
    if (!globalStorePromise) {
        const syncDir = isNodeFileSystemAvailable() ? process.cwd() : undefined;
        globalStorePromise = MemoryStore.create({ ...options, syncDir });
    }
    return globalStorePromise;
}
