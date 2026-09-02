import {
  DEFAULT_DB_PATH,
  PAW_DIR,
  PAW_GATES_REL,
  PAW_TSCONFIG_REL,
  PROJECT_ROOT,
  getPawConfig,
  isNestedHookRun,
  openDbReadonly,
  readHookInput,
  writeBlockingOutput,
  writeHookOutput
} from "./_lib/chunk-5NZEGB7U.mjs";

// hooks/sessionEndHealth.ts
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
function loadSourceDirectories() {
  const configPath = path.join(PAW_DIR, "config.json");
  if (!existsSync(configPath)) return [];
  try {
    const raw = readFileSync(configPath, "utf-8");
    const config = JSON.parse(raw);
    if (Array.isArray(config.sourceDirectories)) {
      return config.sourceDirectories.filter(
        (d) => typeof d === "string"
      );
    }
  } catch {
  }
  return [];
}
function hasSourceChanges() {
  try {
    const dirs = loadSourceDirectories();
    const pathArgs = dirs.length > 0 ? ` -- ${dirs.join(" ")}` : "";
    const unstaged = execSync(`git diff --name-only HEAD${pathArgs}`, {
      cwd: PROJECT_ROOT,
      encoding: "utf-8",
      timeout: 1e4,
      stdio: ["pipe", "pipe", "pipe"]
    }).trim();
    const staged = execSync(`git diff --cached --name-only${pathArgs}`, {
      cwd: PROJECT_ROOT,
      encoding: "utf-8",
      timeout: 1e4,
      stdio: ["pipe", "pipe", "pipe"]
    }).trim();
    return unstaged.length > 0 || staged.length > 0;
  } catch {
    return false;
  }
}
function parseJsonReport(output) {
  const startMarker = "---JSON_REPORT_START---";
  const endMarker = "---JSON_REPORT_END---";
  const startIdx = output.indexOf(startMarker);
  const endIdx = output.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1) return null;
  try {
    const json = output.substring(startIdx + startMarker.length, endIdx).trim();
    return JSON.parse(json);
  } catch {
    return null;
  }
}
function buildActionableContext(report) {
  const failedGates = report.gates.filter(
    (g) => !g.passed && g.severity === "critical"
  );
  if (failedGates.length === 0) {
    return "\u{1F6AB} Health check failed but no specific failures were captured.";
  }
  const issuesByFile = /* @__PURE__ */ new Map();
  for (const gate of failedGates) {
    for (const finding of gate.findings.slice(0, 15)) {
      const file = finding.file ?? gate.gate;
      if (!issuesByFile.has(file)) issuesByFile.set(file, []);
      issuesByFile.get(file).push({
        gate: gate.gate,
        message: finding.message,
        line: finding.line,
        suggestion: finding.suggestion
      });
    }
  }
  const lines = ["\u{1F6AB} Critical health check violations:\n"];
  for (const [file, issues] of issuesByFile) {
    lines.push(`\u{1F4C4} ${file}`);
    for (const issue of issues) {
      const loc = issue.line ? `:${issue.line}` : "";
      lines.push(`   [${issue.gate}] ${issue.message}${loc}`);
      if (issue.suggestion) lines.push(`   \u{1F4A1} ${issue.suggestion}`);
    }
    lines.push("");
  }
  lines.push("Fix these violations before completing the session.");
  return lines.join("\n");
}
async function main() {
  try {
    const cfgDb = await openDbReadonly(DEFAULT_DB_PATH);
    if (cfgDb) {
      try {
        if (getPawConfig(cfgDb, "paw_state") === "disabled") {
          writeHookOutput({ continue: true });
          return;
        }
      } finally {
        cfgDb.close();
      }
    }
  } catch {
  }
  const input = await readHookInput();
  if (isNestedHookRun(input)) {
    writeHookOutput({ continue: true });
    return;
  }
  if (!hasSourceChanges()) {
    writeHookOutput({ continue: true });
    return;
  }
  let output = "";
  let exitCode = 0;
  try {
    output = execSync(
      `npx tsx --tsconfig ${PAW_TSCONFIG_REL} ${PAW_GATES_REL} --changed-only`,
      {
        cwd: PROJECT_ROOT,
        encoding: "utf-8",
        timeout: 9e4,
        stdio: ["pipe", "pipe", "pipe"]
      }
    );
  } catch (err) {
    const execErr = err;
    output = execErr.stdout ?? "";
    exitCode = execErr.status ?? 1;
  }
  const report = parseJsonReport(output);
  if (report?.summary?.hasCritical) {
    const context = buildActionableContext(report);
    writeBlockingOutput({
      continue: true,
      systemMessage: context,
      hookSpecificOutput: {
        hookEventName: "sessionEnd",
        decision: "block",
        reason: "Critical health check violations in changed files"
      }
    });
  } else {
    writeHookOutput({ continue: true });
  }
}
main().catch(() => {
  writeHookOutput({ continue: true });
});
