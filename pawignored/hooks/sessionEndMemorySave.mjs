import {
  runPlugins
} from "./_lib/chunk-PGABHGLT.mjs";
import {
  DEFAULT_DB_PATH,
  PAW_DIR,
  PROJECT_ROOT,
  escalateSessionViolations,
  extractSessionId,
  gcOldViolations,
  getTasksDir,
  isNestedHookRun,
  openDb,
  readHookInput,
  writeHookOutput
} from "./_lib/chunk-5NZEGB7U.mjs";

// hooks/sessionEndMemorySave.ts
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
function ensureSchema(_db) {
}
function findActiveTaskFile() {
  const tasksDir = getTasksDir();
  if (!tasksDir || !existsSync(tasksDir)) return null;
  const files = readdirSync(tasksDir).filter((f) => f.endsWith(".md")).map((f) => {
    const full = path.join(tasksDir, f);
    return { path: full, mtime: statSync(full).mtimeMs };
  }).sort((a, b) => b.mtime - a.mtime);
  return files.length > 0 ? files[0].path : null;
}
function extractTitle(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "Untitled task";
}
function extractStatus(content) {
  if (/\[x\].*completed|status:\s*completed/i.test(content)) return "completed";
  if (/status:\s*in.progress/i.test(content)) return "in-progress";
  return "unknown";
}
function loadDomains() {
  const configPath = path.join(PAW_DIR, "config.json");
  if (!existsSync(configPath)) return [];
  try {
    const raw = readFileSync(configPath, "utf-8");
    const config = JSON.parse(raw);
    if (Array.isArray(config.domains)) {
      return config.domains.filter((d) => typeof d === "string");
    }
  } catch {
  }
  return [];
}
function extractDomain(content) {
  const domains = loadDomains();
  if (domains.length === 0) return null;
  const lower = content.toLowerCase();
  return domains.find((d) => lower.includes(d.toLowerCase())) ?? null;
}
function extractDecisions(content) {
  const decisions = [];
  const domain = extractDomain(content) ?? "general";
  const decisionPattern = /^[-*]\s+(?:Decision|Decided):\s*(.+?)(?:\s*[—–-]\s*(.+?))?(?:\s*\((.+?)\))?$/gm;
  let match;
  while ((match = decisionPattern.exec(content)) !== null) {
    const choice = match[1].trim();
    const rationale = match[2]?.trim() ?? "";
    const context = match[3]?.trim() ?? choice.slice(0, 60);
    if (choice.length > 0) {
      decisions.push({ context, choice, rationale, domain });
    }
  }
  return decisions;
}
function extractAppliedPatterns(input) {
  const names = /* @__PURE__ */ new Set();
  if (Array.isArray(input.patternNames)) {
    for (const n of input.patternNames) {
      if (typeof n === "string") names.add(n);
    }
  }
  const taskFile = findActiveTaskFile();
  if (taskFile) {
    const content = readFileSync(taskFile, "utf-8");
    const patternRe = /^[-*]\s+Pattern:\s*(.+)$/gm;
    let match;
    while ((match = patternRe.exec(content)) !== null) {
      names.add(match[1].trim());
    }
  }
  return [...names];
}
function indexTaskFile(db, filePath) {
  const content = readFileSync(filePath, "utf-8");
  const title = extractTitle(content);
  const status = extractStatus(content);
  const domain = extractDomain(content);
  const relativePath = path.relative(PROJECT_ROOT, filePath).replace(/\\/g, "/");
  const summary = content.split("\n").filter((l) => l.startsWith("- ") || l.startsWith("* ")).slice(0, 5).join("; ").slice(0, 300);
  db.prepare(
    `
    INSERT INTO task_index (file_path, title, status, domain, summary)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(file_path) DO UPDATE SET
      title = excluded.title,
      status = excluded.status,
      domain = excluded.domain,
      summary = excluded.summary,
      completed_at = CASE WHEN excluded.status = 'completed' THEN datetime('now') ELSE completed_at END
  `
  ).run(relativePath, title, status, domain, summary);
}
async function main() {
  const input = await readHookInput();
  if (isNestedHookRun(input)) {
    writeHookOutput({ continue: true });
    return;
  }
  const db = await openDb(DEFAULT_DB_PATH);
  try {
    ensureSchema(db);
    const taskFile = findActiveTaskFile();
    if (taskFile) {
      indexTaskFile(db, taskFile);
      const content = readFileSync(taskFile, "utf-8");
      const decisions = extractDecisions(content);
      const taskRelPath = path.relative(PROJECT_ROOT, taskFile).replace(/\\/g, "/");
      for (const d of decisions) {
        db.prepare(
          `
          INSERT INTO decisions (context, choice, rationale, domain, source_task)
          VALUES (?, ?, ?, ?, ?)
        `
        ).run(d.context, d.choice, d.rationale, d.domain, taskRelPath);
      }
    }
    const appliedPatterns = extractAppliedPatterns(input);
    for (const name of appliedPatterns) {
      const existing = db.prepare("SELECT id FROM patterns WHERE name = ?").get(name);
      if (existing) {
        db.prepare(
          `
          UPDATE patterns SET occurrences = occurrences + 1, last_seen = datetime('now')
          WHERE name = ?
        `
        ).run(name);
      }
    }
    await runPlugins("session-end", input, db);
    const sessionId = extractSessionId(input);
    if (sessionId) {
      const escalated = escalateSessionViolations(db, sessionId);
      if (escalated > 0) {
        process.stderr.write(
          `\u26A0\uFE0F [sessionEndMemorySave] ${escalated} violation(s) escalated to project scope
`
        );
      }
    }
    gcOldViolations(db, 30);
  } finally {
    db.close();
  }
  writeHookOutput({ continue: true });
}
main().catch(() => {
  writeHookOutput({ continue: true });
});
