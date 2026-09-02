import {
  runPlugins
} from "./_lib/chunk-PGABHGLT.mjs";
import {
  resolveStaleIndirectViolations
} from "./_lib/chunk-2HYCHHHY.mjs";
import {
  LOG_PATH,
  PAW_DIR,
  extractSessionId,
  openDbReadonly,
  readHookInput,
  writeHookOutput
} from "./_lib/chunk-5NZEGB7U.mjs";

// hooks/userPromptSubmitted.ts
import { appendFileSync, mkdirSync } from "node:fs";
var MAX_L1_CHARS = 800;
function appendLog(event) {
  mkdirSync(PAW_DIR, { recursive: true });
  const sessionId = extractSessionId(event) ?? "unknown";
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  appendFileSync(
    LOG_PATH,
    `${timestamp} userPromptSubmitted ${sessionId}
`,
    "utf-8"
  );
}
async function loadL1Context(sessionId) {
  const db = await openDbReadonly();
  if (!db) return "";
  const facts = [];
  try {
    const decisions = db.prepare(
      `
      SELECT context, choice, rationale
      FROM decisions
      WHERE superseded_at IS NULL
      ORDER BY valid_from DESC
      LIMIT 5
    `
    ).all();
    for (const d of decisions) {
      facts.push(`Decision: ${d.context} \u2192 ${d.choice} (${d.rationale})`);
    }
  } catch {
  }
  try {
    const patterns = db.prepare(
      `
      SELECT name, description, occurrences
      FROM patterns
      WHERE occurrences >= 3
      ORDER BY occurrences DESC
      LIMIT 5
    `
    ).all();
    for (const p of patterns) {
      facts.push(`Pattern (${p.occurrences}x): ${p.name} \u2014 ${p.description}`);
    }
  } catch {
  }
  try {
    const violations = db.prepare(
      `
      SELECT file_path, rule, message, created_at
      FROM violations
      WHERE resolved_at IS NULL
        AND (session_id = ? OR session_id IS NULL)
      ORDER BY created_at DESC
      LIMIT 5
    `
    ).all(sessionId ?? null);
    for (const v of violations) {
      facts.push(`\u26A0 Violation: ${v.message} (${v.file_path})`);
    }
  } catch {
  }
  db.close();
  let context = facts.join("\n");
  if (context.length > MAX_L1_CHARS) {
    context = context.slice(0, MAX_L1_CHARS) + "\n[truncated]";
  }
  return context;
}
async function main() {
  const hookInput = await readHookInput();
  appendLog(hookInput);
  await resolveStaleIndirectViolations();
  const sessionId = extractSessionId(hookInput);
  const l1Context = await loadL1Context(sessionId);
  const pluginResult = await runPlugins(
    "user-prompt-submitted",
    hookInput,
    null
  );
  const pluginMessages = pluginResult.messages.length > 0 ? `
## Plugin Notes
${pluginResult.messages.join("\n")}` : "";
  if (l1Context.length > 0 || pluginMessages.length > 0) {
    writeHookOutput({
      continue: true,
      systemMessage: [
        l1Context.length > 0 ? `## PAW Memory (L1)
${l1Context}` : "",
        pluginMessages
      ].filter(Boolean).join("\n")
    });
  } else {
    writeHookOutput({ continue: true });
  }
}
main().catch(() => {
  writeHookOutput({ continue: true });
});
