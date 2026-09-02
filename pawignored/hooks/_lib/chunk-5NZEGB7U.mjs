var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// hookRuntime.ts
import { readFileSync } from "node:fs";
function readHookInput() {
  try {
    const data = readFileSync(0, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}
function writeHookOutput(result) {
  process.stdout.write(`${JSON.stringify(result)}
`);
}
function writeBlockingOutput(result) {
  writeHookOutput(result);
  process.exit(2);
}
function writeDenyOutput(reason) {
  const result = {
    continue: true,
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: reason
    }
  };
  process.stdout.write(`${JSON.stringify(result)}
`);
}
function extractFirstFileArrayPath(files) {
  for (const f of files) {
    if (typeof f === "string") return f;
    if (typeof f === "object" && f !== null) {
      const rec = f;
      for (const key of ["filePath", "file_path", "path"]) {
        if (typeof rec[key] === "string") return rec[key];
      }
      return void 0;
    }
  }
  return void 0;
}
function resolveEditedFilePath(hookInput) {
  const candidates = [];
  const input = hookInput;
  if (typeof input.filePath === "string") {
    candidates.push(input.filePath);
  }
  if (input.toolInput) {
    if (typeof input.toolInput.path === "string")
      candidates.push(input.toolInput.path);
    if (typeof input.toolInput.filePath === "string")
      candidates.push(input.toolInput.filePath);
    if (typeof input.toolInput.file_path === "string")
      candidates.push(input.toolInput.file_path);
    const toolInputFiles = input.toolInput.files;
    if (Array.isArray(toolInputFiles)) {
      const first = extractFirstFileArrayPath(toolInputFiles);
      if (first !== void 0) candidates.push(first);
    }
  }
  let parsedToolInput = {};
  if (typeof input.tool_input === "string") {
    try {
      parsedToolInput = JSON.parse(input.tool_input);
    } catch {
      parsedToolInput = {};
    }
  } else if (typeof input.tool_input === "object" && input.tool_input !== null) {
    parsedToolInput = input.tool_input;
  }
  if (typeof parsedToolInput.filePath === "string")
    candidates.push(parsedToolInput.filePath);
  if (typeof parsedToolInput.file_path === "string")
    candidates.push(parsedToolInput.file_path);
  if (typeof parsedToolInput.path === "string")
    candidates.push(parsedToolInput.path);
  if (Array.isArray(parsedToolInput.files)) {
    const first = extractFirstFileArrayPath(parsedToolInput.files);
    if (first !== void 0) candidates.push(first);
  }
  let parsedArgs = {};
  if (typeof input.toolArgs === "string") {
    try {
      parsedArgs = JSON.parse(input.toolArgs);
    } catch {
      parsedArgs = {};
    }
  } else if (typeof input.toolArgs === "object" && input.toolArgs !== null) {
    parsedArgs = input.toolArgs;
  }
  if (typeof parsedArgs.filePath === "string")
    candidates.push(parsedArgs.filePath);
  if (typeof parsedArgs.file_path === "string")
    candidates.push(parsedArgs.file_path);
  if (Array.isArray(parsedArgs.files)) {
    const first = extractFirstFileArrayPath(parsedArgs.files);
    if (first !== void 0) candidates.push(first);
  }
  const nestedInput = parsedArgs.input;
  if (nestedInput && typeof nestedInput.filePath === "string") {
    candidates.push(nestedInput.filePath);
  }
  return candidates.find((v) => v.trim().length > 0) ?? process.argv[2];
}
function extractSessionId(hookInput) {
  if (typeof hookInput.session_id === "string" && hookInput.session_id.length > 0) {
    return hookInput.session_id;
  }
  if (typeof hookInput.sessionId === "string" && hookInput.sessionId.length > 0) {
    return hookInput.sessionId;
  }
  return null;
}
function isNestedHookRun(hookInput) {
  return hookInput.stop_hook_active === true || hookInput.session_end_hook_active === true || hookInput.sessionEnd_hook_active === true;
}

// pawPaths.ts
import { existsSync, readFileSync as readFileSync2 } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var PAW_CORE_DIR = __dirname;
var PROJECT_ROOT = process.cwd();
var PAW_DIR = path.join(PROJECT_ROOT, ".paw");
var GATES_DIR = path.join(PAW_DIR, "gates");
var HOOKS_DIR = path.join(PAW_DIR, "hooks");
var PLUGINS_DIR = path.join(PAW_DIR, "plugins");
var DB_PATH = path.join(PAW_DIR, "paw.sqlite");
var LOG_PATH = path.join(PAW_DIR, "paw.log");
var PAWIGNORE_PATH = path.join(PROJECT_ROOT, ".pawignore");
var HOOKS_JSON_PATH = path.join(
  PROJECT_ROOT,
  ".github",
  "hooks",
  "hooks.json"
);
var SDK_SESSION_PATH = path.join(PAW_DIR, "sdk-session.ts");
var PAW_CONFIG_PATH = path.join(PAW_DIR, "config.json");
function getConfigPath(key) {
  if (!existsSync(PAW_CONFIG_PATH)) return null;
  try {
    const raw = readFileSync2(PAW_CONFIG_PATH, "utf-8");
    const config = JSON.parse(raw);
    if (typeof config[key] === "string") {
      return path.join(PROJECT_ROOT, config[key]);
    }
  } catch {
    return null;
  }
  return null;
}
function getTasksDir() {
  return getConfigPath("tasksDir");
}
var PAW_TSCONFIG = path.join(PAW_DIR, "tsconfig.json");
var PAW_TSCONFIG_REL = ".paw/tsconfig.json";
var PAW_TSCONFIG_TEMPLATE = path.join(
  PAW_CORE_DIR,
  "templates",
  "tsconfig.json"
);
var PAW_GATES_REL = ".github/PAW/pawGates.ts";
var _ignorePatterns = null;
function loadIgnorePatterns() {
  if (_ignorePatterns) return _ignorePatterns;
  const defaultExcludes = ["node_modules", ".next", ".git", "coverage", "dist"];
  const lines = existsSync(PAWIGNORE_PATH) ? readFileSync2(PAWIGNORE_PATH, "utf-8").split("\n") : defaultExcludes;
  _ignorePatterns = lines.map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith("#")).map((pattern) => {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*").replace(/\?/g, "[^/]");
    return new RegExp(escaped);
  });
  return _ignorePatterns;
}
function isPathIgnored(relativePath) {
  if (relativePath.startsWith(".github/PAW/") || relativePath.startsWith(".paw/")) {
    return true;
  }
  return loadIgnorePatterns().some((pattern) => pattern.test(relativePath));
}
function toProjectRelative(filePath) {
  const forwardSlash = filePath.replace(/\\/g, "/");
  const rootForward = PROJECT_ROOT.replace(/\\/g, "/");
  const lower = forwardSlash.toLowerCase();
  const rootLower = rootForward.toLowerCase();
  if (lower.startsWith(rootLower + "/")) {
    return forwardSlash.slice(rootForward.length + 1);
  }
  if (lower.startsWith(rootLower)) {
    return forwardSlash.slice(rootForward.length);
  }
  return forwardSlash.replace(/^[a-z]:\//i, "").replace(/^\//, "");
}

// pawDb.ts
import { existsSync as existsSync2, mkdirSync, readFileSync as readFileSync3, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import initSqlJs from "sql.js";
var SQL = null;
async function getSqlEngine() {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  return SQL;
}
function persistToFile(db, dbPath) {
  const data = db.export();
  const buffer = Buffer.from(data);
  mkdirSync(dirname(dbPath), { recursive: true });
  writeFileSync(dbPath, buffer);
}
function wrapDatabase(db, dbPath, readonly) {
  return {
    _db: db,
    _path: dbPath,
    _readonly: readonly,
    prepare(sql) {
      return {
        get(...params) {
          const stmt = db.prepare(sql);
          if (params.length > 0) stmt.bind(params);
          if (stmt.step()) {
            const obj = stmt.getAsObject();
            stmt.free();
            return obj;
          }
          stmt.free();
          return void 0;
        },
        all(...params) {
          const results = db.exec(
            sql,
            params.length > 0 ? params : void 0
          );
          if (results.length === 0) return [];
          const { columns, values } = results[0];
          return values.map((row) => {
            const obj = {};
            columns.forEach((col, i) => {
              obj[col] = row[i];
            });
            return obj;
          });
        },
        run(...params) {
          if (readonly) throw new Error("Cannot write to readonly database");
          db.run(sql, params.length > 0 ? params : void 0);
          const meta = db.exec(
            "SELECT changes() as c, last_insert_rowid() as r"
          );
          const changes = meta.length > 0 ? meta[0].values[0][0] : 0;
          const lastInsertRowid = meta.length > 0 ? meta[0].values[0][1] : 0;
          persistToFile(db, dbPath);
          return { changes, lastInsertRowid };
        }
      };
    },
    pragma(_str) {
      return void 0;
    },
    exec(sql) {
      db.run(sql);
      if (!readonly) {
        persistToFile(db, dbPath);
      }
    },
    close() {
      db.close();
    }
  };
}
function normalizePath(p) {
  return p.replace(/\\/g, "/");
}
var DEFAULT_DB_PATH = DB_PATH;
function ensureSchema(db) {
  db._db.run(`
    CREATE TABLE IF NOT EXISTS decisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      context TEXT NOT NULL,
      choice TEXT NOT NULL,
      rationale TEXT NOT NULL,
      domain TEXT,
      valid_from TEXT NOT NULL DEFAULT (datetime('now')),
      superseded_at TEXT,
      superseded_by INTEGER REFERENCES decisions(id),
      source_task TEXT,
      created_by TEXT DEFAULT 'agent'
    );
    CREATE TABLE IF NOT EXISTS patterns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      example TEXT,
      domain TEXT,
      occurrences INTEGER NOT NULL DEFAULT 1,
      first_seen TEXT NOT NULL DEFAULT (datetime('now')),
      last_seen TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS agent_memory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent TEXT NOT NULL,
      hint TEXT NOT NULL,
      domain TEXT,
      confidence REAL DEFAULT 1.0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS task_index (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      domain TEXT,
      summary TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS memory_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS violations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT NOT NULL,
      rule TEXT NOT NULL,
      message TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'error',
      hook_event TEXT NOT NULL,
      session_id TEXT,
      resolved_at TEXT,
      indirect_fix INTEGER NOT NULL DEFAULT 0,
      memory_type_id INTEGER NOT NULL REFERENCES memory_types(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS paw_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS file_memories (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path      TEXT NOT NULL,
      memory         TEXT NOT NULL,
      content_hash   TEXT,
      session_id     TEXT,
      created_at     TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at     TEXT DEFAULT (datetime('now')),
      UNIQUE (file_path, content_hash)
    );
    CREATE TABLE IF NOT EXISTS repo_conventions (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      name           TEXT UNIQUE NOT NULL,
      description    TEXT,
      frequency      INTEGER DEFAULT 1,
      updated_at     TEXT DEFAULT (datetime('now'))
    );
  `);
  db._db.run(`
    CREATE INDEX IF NOT EXISTS idx_decisions_active ON decisions(superseded_at) WHERE superseded_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_decisions_domain ON decisions(domain);
    CREATE INDEX IF NOT EXISTS idx_patterns_domain ON patterns(domain);
    CREATE INDEX IF NOT EXISTS idx_patterns_occurrences ON patterns(occurrences DESC);
    CREATE INDEX IF NOT EXISTS idx_agent_memory_agent ON agent_memory(agent);
    CREATE INDEX IF NOT EXISTS idx_task_index_status ON task_index(status);
    CREATE INDEX IF NOT EXISTS idx_task_index_domain ON task_index(domain);
    CREATE INDEX IF NOT EXISTS idx_violations_file ON violations(file_path);
    CREATE INDEX IF NOT EXISTS idx_violations_unresolved ON violations(resolved_at) WHERE resolved_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_violations_hook ON violations(hook_event);
    CREATE INDEX IF NOT EXISTS idx_violations_memory_type ON violations(memory_type_id);
    CREATE INDEX IF NOT EXISTS idx_violations_session ON violations(session_id) WHERE resolved_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_file_memories_path ON file_memories(file_path);
    CREATE INDEX IF NOT EXISTS idx_file_memories_hash ON file_memories(file_path, content_hash);
  `);
  persistToFile(db._db, db._path);
  seedMemoryTypes(db);
}
var DEFAULT_MEMORY_TYPES = [
  {
    name: "decision",
    description: "Architectural choice with supersession chain"
  },
  {
    name: "pattern",
    description: "Recurring codebase pattern with occurrence tracking"
  },
  {
    name: "hint",
    description: "Per-agent persistent hint from prior sessions"
  },
  { name: "task", description: "Task file index entry for rapid lookup" },
  {
    name: "violation",
    description: "Hook-detected rule violation with resolution tracking"
  }
];
function seedMemoryTypes(db) {
  for (const mt of DEFAULT_MEMORY_TYPES) {
    db.prepare(
      "INSERT OR IGNORE INTO memory_types (name, description) VALUES (?, ?)"
    ).run(mt.name, mt.description);
  }
}
function getMemoryTypeId(db, typeName) {
  const row = db.prepare("SELECT id FROM memory_types WHERE name = ?").get(typeName);
  if (!row) {
    throw new Error(`Unknown memory type: ${typeName}`);
  }
  return row.id;
}
function insertViolation(db, violation) {
  const memoryTypeId = getMemoryTypeId(db, "violation");
  const normalizedFilePath = normalizePath(violation.filePath);
  if (!violation.sessionId) {
    process.stderr.write(
      `\u26A0\uFE0F PAW: insertViolation called without sessionId \u2014 violation stored as project-scoped (NULL). file=${normalizedFilePath} rule=${violation.rule}
`
    );
  }
  const result = db.prepare(
    `INSERT INTO violations (file_path, rule, message, severity, hook_event, session_id, indirect_fix, memory_type_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    normalizedFilePath,
    violation.rule,
    violation.message,
    violation.severity ?? "error",
    violation.hookEvent,
    violation.sessionId ?? null,
    violation.indirectFix ? 1 : 0,
    memoryTypeId
  );
  return Number(result.lastInsertRowid);
}
function getUnresolvedViolations(db, filePath) {
  if (filePath) {
    return db.prepare(
      `SELECT * FROM violations WHERE resolved_at IS NULL AND file_path = ? ORDER BY created_at DESC`
    ).all(normalizePath(filePath));
  }
  return db.prepare(
    `SELECT * FROM violations WHERE resolved_at IS NULL ORDER BY created_at DESC`
  ).all();
}
function getSessionViolations(db, sessionId) {
  return db.prepare(
    `SELECT * FROM violations
       WHERE resolved_at IS NULL AND (session_id = ? OR session_id IS NULL)
       ORDER BY created_at DESC`
  ).all(sessionId);
}
function escalateSessionViolations(db, sessionId) {
  const result = db.prepare(
    `UPDATE violations SET session_id = NULL
       WHERE session_id = ? AND resolved_at IS NULL`
  ).run(sessionId);
  return result.changes;
}
function resolveViolationsForFile(db, filePath, sessionId) {
  const normalizedFilePath = normalizePath(filePath);
  if (sessionId) {
    const result2 = db.prepare(
      `UPDATE violations SET resolved_at = datetime('now')
         WHERE file_path = ? AND session_id = ? AND resolved_at IS NULL`
    ).run(normalizedFilePath, sessionId);
    return result2.changes;
  }
  const result = db.prepare(
    `UPDATE violations SET resolved_at = datetime('now')
       WHERE file_path = ? AND session_id IS NULL AND resolved_at IS NULL`
  ).run(normalizedFilePath);
  return result.changes;
}
function gcOldViolations(db, retentionDays = 30, staleTtlHours = 48) {
  const deleted = db.prepare(
    `DELETE FROM violations
       WHERE resolved_at IS NOT NULL
       AND resolved_at < datetime('now', '-' || ? || ' days')`
  ).run(retentionDays).changes;
  const autoResolved = db.prepare(
    `UPDATE violations
       SET resolved_at = datetime('now')
       WHERE resolved_at IS NULL
       AND created_at < datetime('now', '-' || ? || ' hours')`
  ).run(staleTtlHours).changes;
  return deleted + autoResolved;
}
function pruneOrphanedViolations(db) {
  const unresolved = db.prepare(
    `SELECT DISTINCT file_path FROM violations WHERE resolved_at IS NULL`
  ).all();
  let pruned = 0;
  for (const row of unresolved) {
    const fp = row.file_path;
    const isAbsolute = /^[a-z]:\//i.test(fp) || fp.startsWith("/");
    const absPath = isAbsolute ? fp : join(process.cwd(), fp);
    if (!existsSync2(absPath)) {
      pruned += db.prepare(
        `UPDATE violations SET resolved_at = datetime('now')
         WHERE file_path = ? AND resolved_at IS NULL`
      ).run(fp).changes;
    }
  }
  return pruned;
}
function getPawConfig(db, key) {
  const row = db.prepare("SELECT value FROM paw_config WHERE key = ?").get(key);
  return row?.value ?? null;
}
async function openDb(dbPath = DEFAULT_DB_PATH, options = {}) {
  mkdirSync(dirname(dbPath), { recursive: true });
  const engine = await getSqlEngine();
  let db;
  if (existsSync2(dbPath)) {
    const fileBuffer = readFileSync3(dbPath);
    db = new engine.Database(fileBuffer);
  } else {
    db = new engine.Database();
  }
  const wrapped = wrapDatabase(db, dbPath, options.readonly ?? false);
  if (!options.readonly) {
    ensureSchema(wrapped);
  }
  return wrapped;
}
async function openDbReadonly(dbPath = DEFAULT_DB_PATH) {
  if (!existsSync2(dbPath)) return null;
  return openDb(dbPath, { readonly: true });
}

export {
  __commonJS,
  __toESM,
  readHookInput,
  writeHookOutput,
  writeBlockingOutput,
  writeDenyOutput,
  resolveEditedFilePath,
  extractSessionId,
  isNestedHookRun,
  PROJECT_ROOT,
  PAW_DIR,
  GATES_DIR,
  PLUGINS_DIR,
  LOG_PATH,
  PAW_CONFIG_PATH,
  getTasksDir,
  PAW_TSCONFIG_REL,
  PAW_GATES_REL,
  isPathIgnored,
  toProjectRelative,
  normalizePath,
  DEFAULT_DB_PATH,
  insertViolation,
  getUnresolvedViolations,
  getSessionViolations,
  escalateSessionViolations,
  resolveViolationsForFile,
  gcOldViolations,
  pruneOrphanedViolations,
  getPawConfig,
  openDb,
  openDbReadonly
};
