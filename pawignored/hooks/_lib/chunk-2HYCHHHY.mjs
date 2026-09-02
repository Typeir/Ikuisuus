import {
  DEFAULT_DB_PATH,
  PROJECT_ROOT,
  openDb,
  openDbReadonly
} from "./chunk-5NZEGB7U.mjs";

// resolveIndirectViolations.ts
import { existsSync } from "node:fs";
import path from "node:path";
var INDIRECT_RESOLVERS = {
  "missing-test": (filePath) => {
    const ext = filePath.endsWith(".tsx") ? ".tsx" : ".ts";
    const baseName = filePath.replace(/\.(ts|tsx)$/, "");
    const candidates = [
      path.join(PROJECT_ROOT, "tests", "unit", `${baseName}.test${ext}`),
      path.join(PROJECT_ROOT, "tests", "integration", `${baseName}.test${ext}`),
      path.join(PROJECT_ROOT, "tests", "unit", `${path.basename(baseName)}.test${ext}`),
      path.join(
        PROJECT_ROOT,
        "tests",
        "integration",
        `${path.basename(baseName)}.test${ext}`
      )
    ];
    return candidates.some((c) => existsSync(c));
  }
};
async function resolveStaleIndirectViolations(sessionId) {
  const result = {
    checked: 0,
    resolved: 0,
    resolvedFiles: []
  };
  let violations;
  try {
    const readDb = await openDbReadonly(DEFAULT_DB_PATH);
    if (!readDb) return result;
    try {
      violations = readDb.prepare(
        `SELECT * FROM violations WHERE resolved_at IS NULL AND indirect_fix = 1`
      ).all();
    } finally {
      readDb.close();
    }
  } catch {
    return result;
  }
  if (violations.length === 0) return result;
  const toResolve = [];
  for (const v of violations) {
    result.checked++;
    const checker = INDIRECT_RESOLVERS[v.rule];
    if (checker && checker(v.file_path)) {
      toResolve.push(v);
    }
  }
  if (toResolve.length === 0) return result;
  try {
    const writeDb = await openDb(DEFAULT_DB_PATH);
    if (!writeDb) return result;
    try {
      const stmt = writeDb.prepare(
        `UPDATE violations SET resolved_at = datetime('now') WHERE id = ? AND resolved_at IS NULL`
      );
      for (const v of toResolve) {
        const changes = stmt.run(v.id).changes;
        if (changes > 0) {
          result.resolved++;
          if (!result.resolvedFiles.includes(v.file_path)) {
            result.resolvedFiles.push(v.file_path);
          }
        }
      }
    } finally {
      writeDb.close();
    }
  } catch {
  }
  return result;
}

export {
  resolveStaleIndirectViolations
};
