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
exports.createMemoryDb = createMemoryDb;
function isNode() {
    return (typeof process !== 'undefined' &&
        typeof process.versions === 'object' &&
        !!process.versions.node);
}
class NodeSqliteEngine {
    db;
    constructor(db) {
        this.db = db;
    }
    exec(sql) {
        this.db.exec(sql);
    }
    prepare(sql) {
        const stmt = this.db.prepare(sql);
        return {
            run: (...params) => {
                stmt.run(...params);
            },
            get: (...params) => stmt.get(...params),
            all: (...params) => stmt.all(...params),
        };
    }
    close() {
        this.db.close();
    }
}
class WasmSqliteEngine {
    db;
    constructor(db) {
        this.db = db;
    }
    exec(sql) {
        this.db.exec(sql);
    }
    prepare(sql) {
        const stmt = this.db.prepare(sql);
        return {
            run: (...params) => this.runStatement(stmt, params),
            get: (...params) => this.getStatement(stmt, params),
            all: (...params) => this.allStatement(stmt, params),
        };
    }
    runStatement(stmt, params) {
        try {
            stmt.bind(params);
            stmt.step();
        }
        finally {
            stmt.free();
        }
    }
    getStatement(stmt, params) {
        try {
            stmt.bind(params);
            if (!stmt.step())
                return undefined;
            return stmt.getAsObject();
        }
        finally {
            stmt.free();
        }
    }
    allStatement(stmt, params) {
        const rows = [];
        try {
            stmt.bind(params);
            while (stmt.step()) {
                rows.push(stmt.getAsObject());
            }
            return rows;
        }
        finally {
            stmt.free();
        }
    }
    close() {
        this.db.close();
    }
}
function getDefaultDbPath() {
    return './memory.sqlite';
}
/**
 * Create a SQLite engine appropriate for the current environment.
 *
 * - Node.js / Electron: better-sqlite3 (persistent file)
 * - Browser / mobile: sql.js WASM (in-memory unless persisted externally)
 * - EdgeOne Functions / unsupported: throws, caller should fall back to disabled store
 */
async function createMemoryDb(options) {
    if (isNode()) {
        const { default: Database } = await Promise.resolve().then(() => __importStar(require('better-sqlite3')));
        const path = options?.path ?? getDefaultDbPath();
        return new NodeSqliteEngine(new Database(path));
    }
    const { default: initSqlJs } = await Promise.resolve().then(() => __importStar(require('sql.js')));
    const SQL = await initSqlJs(options?.sqlJsConfig ?? {});
    return new WasmSqliteEngine(new SQL.Database());
}
