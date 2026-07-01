import type {
  Database as SqlJsDatabase,
  Statement as SqlJsStatement,
  SqlJsConfig,
  SqlValue,
} from 'sql.js';

export interface SqliteStatement {
  run(...params: unknown[]): void;
  get(...params: unknown[]): unknown | undefined;
  all(...params: unknown[]): unknown[];
}

export interface SqliteEngine {
  exec(sql: string): void;
  prepare(sql: string): SqliteStatement;
  close(): void;
}

export interface CreateMemoryDbOptions {
  /** Database file path for Node/Electron. Use ':memory:' for an in-memory database. */
  path?: string;
  /** sql.js init options (locateFile, etc.). Only used in browser/WASM environments. */
  sqlJsConfig?: SqlJsConfig;
}

function isNode(): boolean {
  return (
    typeof process !== 'undefined' &&
    typeof process.versions === 'object' &&
    !!process.versions.node
  );
}

class NodeSqliteEngine implements SqliteEngine {
  private db: InstanceType<typeof import('better-sqlite3')>;

  constructor(db: InstanceType<typeof import('better-sqlite3')>) {
    this.db = db;
  }

  exec(sql: string): void {
    this.db.exec(sql);
  }

  prepare(sql: string): SqliteStatement {
    const stmt = this.db.prepare(sql);
    return {
      run: (...params: unknown[]) => {
        stmt.run(...params);
      },
      get: (...params: unknown[]) => stmt.get(...params) as unknown | undefined,
      all: (...params: unknown[]) => stmt.all(...params) as unknown[],
    };
  }

  close(): void {
    this.db.close();
  }
}

class WasmSqliteEngine implements SqliteEngine {
  private db: SqlJsDatabase;

  constructor(db: SqlJsDatabase) {
    this.db = db;
  }

  exec(sql: string): void {
    this.db.exec(sql);
  }

  prepare(sql: string): SqliteStatement {
    const stmt = this.db.prepare(sql);
    return {
      run: (...params: unknown[]) => this.runStatement(stmt, params),
      get: (...params: unknown[]) => this.getStatement(stmt, params),
      all: (...params: unknown[]) => this.allStatement(stmt, params),
    };
  }

  private runStatement(stmt: SqlJsStatement, params: unknown[]): void {
    try {
      stmt.bind(params as SqlValue[]);
      stmt.step();
    } finally {
      stmt.free();
    }
  }

  private getStatement(stmt: SqlJsStatement, params: unknown[]): unknown | undefined {
    try {
      stmt.bind(params as SqlValue[]);
      if (!stmt.step()) return undefined;
      return stmt.getAsObject();
    } finally {
      stmt.free();
    }
  }

  private allStatement(stmt: SqlJsStatement, params: unknown[]): unknown[] {
    const rows: unknown[] = [];
    try {
      stmt.bind(params as SqlValue[]);
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      return rows;
    } finally {
      stmt.free();
    }
  }

  close(): void {
    this.db.close();
  }
}

function getDefaultDbPath(): string {
  return './memory.sqlite';
}

/**
 * Create a SQLite engine appropriate for the current environment.
 *
 * - Node.js / Electron: better-sqlite3 (persistent file)
 * - Browser / mobile: sql.js WASM (in-memory unless persisted externally)
 * - EdgeOne Functions / unsupported: throws, caller should fall back to disabled store
 */
export async function createMemoryDb(options?: CreateMemoryDbOptions): Promise<SqliteEngine> {
  if (isNode()) {
    const { default: Database } = await import('better-sqlite3');
    const path = options?.path ?? getDefaultDbPath();
    return new NodeSqliteEngine(new Database(path));
  }

  const { default: initSqlJs } = await import('sql.js');
  const SQL = await initSqlJs(options?.sqlJsConfig ?? {});
  return new WasmSqliteEngine(new SQL.Database());
}
