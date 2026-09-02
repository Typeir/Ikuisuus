import {
  runPlugins
} from "./_lib/chunk-PGABHGLT.mjs";
import {
  resolveStaleIndirectViolations
} from "./_lib/chunk-2HYCHHHY.mjs";
import {
  DEFAULT_DB_PATH,
  PROJECT_ROOT,
  extractSessionId,
  getPawConfig,
  getSessionViolations,
  getUnresolvedViolations,
  isPathIgnored,
  normalizePath,
  openDb,
  openDbReadonly,
  pruneOrphanedViolations,
  readHookInput,
  toProjectRelative,
  writeDenyOutput,
  writeHookOutput
} from "./_lib/chunk-5NZEGB7U.mjs";

// hooks/preToolUse.ts
import { existsSync } from "node:fs";
import { join } from "node:path";
var EXEMPT_TOOLS = /* @__PURE__ */ new Set([
  "read_file",
  "view_image",
  "grep_search",
  "file_search",
  "semantic_search",
  "list_dir",
  "get_errors",
  "get_terminal_output",
  "memory",
  "manage_todo_list",
  "vscode_askQuestions",
  "tool_search_tool_regex",
  "fetch_webpage",
  "task_complete"
]);
var ENV_FILE_BASENAME_REGEX = /(?:^|[\\/])\.env(?:\.[A-Za-z0-9_.-]+)?$/;
var ENV_FILE_COMMAND_REGEX = /(?:^|[\s"'`(=/\\])\.env(?:\.[A-Za-z0-9_.-]+)?(?=$|[\s"'`)|&;><])/;
function extractCommandStrings(hookInput) {
  const commands = [];
  const visit = (source) => {
    let parsed = {};
    if (typeof source === "string") {
      try {
        parsed = JSON.parse(source);
      } catch {
        return;
      }
    } else if (typeof source === "object" && source !== null) {
      parsed = source;
    } else {
      return;
    }
    if (typeof parsed.command === "string") {
      commands.push(parsed.command);
    }
    if (typeof parsed.input === "object" && parsed.input !== null) {
      const nested = parsed.input;
      if (typeof nested.command === "string") {
        commands.push(nested.command);
      }
    }
  };
  visit(hookInput.toolInput);
  visit(hookInput.tool_input);
  visit(hookInput.toolArgs);
  return commands;
}
function detectEnvFileAccess(hookInput) {
  const paths = extractToolFilePaths(hookInput);
  for (const p of paths) {
    if (ENV_FILE_BASENAME_REGEX.test(p)) return p;
  }
  const commands = extractCommandStrings(hookInput);
  for (const cmd of commands) {
    if (ENV_FILE_COMMAND_REGEX.test(cmd)) return cmd;
  }
  return null;
}
function extractToolFilePaths(hookInput) {
  const paths = [];
  function harvestPaths(source) {
    let parsed = {};
    if (typeof source === "string") {
      try {
        parsed = JSON.parse(source);
      } catch {
        return;
      }
    } else if (typeof source === "object" && source !== null) {
      parsed = source;
    } else {
      return;
    }
    for (const key of ["filePath", "file_path", "path"]) {
      if (typeof parsed[key] === "string") {
        paths.push(normalizePath(parsed[key]));
      }
    }
    if (typeof parsed.input === "object" && parsed.input !== null) {
      const nested = parsed.input;
      for (const key of ["filePath", "file_path", "path"]) {
        if (typeof nested[key] === "string") {
          paths.push(normalizePath(nested[key]));
        }
      }
    }
    if (typeof parsed.input === "string") {
      const patchText = parsed.input;
      const patchFileRegex = /^\*\*\*\s*(?:Update File|Add File|Delete File):\s*(.+)$/gim;
      let m = null;
      while ((m = patchFileRegex.exec(patchText)) !== null) {
        paths.push(normalizePath(m[1].trim()));
      }
      const absPathPattern = /(?:[a-zA-Z]:[\\\/]|\/)[^\s"'`;|&<>]+/g;
      const absMatches = patchText.match(absPathPattern);
      if (absMatches) {
        for (const a of absMatches) {
          paths.push(normalizePath(a));
        }
      }
    }
    if (Array.isArray(parsed.replacements)) {
      for (const r of parsed.replacements) {
        if (typeof r === "object" && r !== null && typeof r.filePath === "string") {
          paths.push(
            normalizePath(r.filePath)
          );
        }
      }
    }
    if (Array.isArray(parsed.files)) {
      for (const f of parsed.files) {
        if (typeof f === "string") {
          paths.push(normalizePath(f));
        } else if (typeof f === "object" && f !== null) {
          const rec = f;
          for (const key of ["filePath", "file_path", "path"]) {
            if (typeof rec[key] === "string") {
              paths.push(normalizePath(rec[key]));
              break;
            }
          }
        }
      }
    }
    if (typeof parsed.command === "string") {
      const absPathPattern = /(?:[a-zA-Z]:[\\\/]|\/)[^\s"'`;|&<>]+/g;
      const matches = parsed.command.match(absPathPattern);
      if (matches) {
        for (const m of matches) {
          paths.push(normalizePath(m));
        }
      }
    }
  }
  if (typeof hookInput.filePath === "string") {
    paths.push(normalizePath(hookInput.filePath));
  }
  harvestPaths(hookInput.toolInput);
  harvestPaths(hookInput.tool_input);
  harvestPaths(hookInput.toolArgs);
  return paths;
}
function isFixingViolatedFile(hookInput, violations) {
  const toolPaths = extractToolFilePaths(hookInput);
  if (toolPaths.length === 0) return false;
  const violatedRelPaths = new Set(
    violations.filter((v) => v.indirect_fix === 0).map((v) => toProjectRelative(v.file_path))
  );
  const toolRelPaths = toolPaths.map(toProjectRelative);
  for (const toolRel of toolRelPaths) {
    if (violatedRelPaths.has(toolRel)) {
      return true;
    }
  }
  return false;
}
function allViolationsAreIndirectFix(violations) {
  return violations.every((v) => v.indirect_fix === 1);
}
function isTargetingIgnoredFiles(hookInput) {
  const toolPaths = extractToolFilePaths(hookInput);
  if (toolPaths.length === 0) return false;
  return toolPaths.every(
    (absPath) => isPathIgnored(toProjectRelative(absPath))
  );
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
  const hookInput = await readHookInput();
  const toolName = typeof hookInput.tool_name === "string" ? hookInput.tool_name : typeof hookInput.toolName === "string" ? hookInput.toolName : "";
  const envMatch = detectEnvFileAccess(hookInput);
  if (envMatch) {
    writeDenyOutput(
      [
        `\u{1F512} Access to .env files is blocked by PAW.`,
        ``,
        `Tool: ${toolName || "(unknown)"}`,
        `Match: ${envMatch}`,
        ``,
        `Environment files contain credentials and must never enter the model context.`,
        `If you need to change an env var, ask the user to edit the file directly.`
      ].join("\n")
    );
    return;
  }
  if (EXEMPT_TOOLS.has(toolName)) {
    writeHookOutput({ continue: true });
    return;
  }
  const sessionId = extractSessionId(hookInput);
  let violations = [];
  try {
    const db = await openDbReadonly(DEFAULT_DB_PATH);
    if (!db) {
      writeHookOutput({ continue: true });
      return;
    }
    try {
      if (sessionId) {
        violations = getSessionViolations(db, sessionId);
      } else {
        process.stderr.write(
          `\u26A0\uFE0F PAW preToolUse: no session_id in hook input \u2014 falling back to all unresolved violations (session isolation unavailable).
`
        );
        violations = getUnresolvedViolations(db);
      }
    } finally {
      db.close();
    }
  } catch {
    writeHookOutput({ continue: true });
    return;
  }
  if (violations.length > 0) {
    const resolveAbsolute = (fp) => {
      const isAbs = /^[a-z]:\//i.test(fp) || fp.startsWith("/");
      return isAbs ? fp : join(PROJECT_ROOT, fp);
    };
    const hasOrphans = violations.some(
      (v) => !existsSync(resolveAbsolute(v.file_path))
    );
    if (hasOrphans) {
      try {
        const writeDb = await openDb(DEFAULT_DB_PATH);
        try {
          pruneOrphanedViolations(writeDb);
        } finally {
          writeDb.close();
        }
        const readDb = await openDbReadonly(DEFAULT_DB_PATH);
        if (readDb) {
          try {
            violations = sessionId ? getSessionViolations(readDb, sessionId) : getUnresolvedViolations(readDb);
          } finally {
            readDb.close();
          }
        }
      } catch {
        violations = violations.filter(
          (v) => existsSync(resolveAbsolute(v.file_path))
        );
      }
    }
  }
  if (violations.some((v) => v.indirect_fix === 1)) {
    const resolution = await resolveStaleIndirectViolations(sessionId);
    if (resolution.resolved > 0) {
      try {
        const freshDb = await openDbReadonly(DEFAULT_DB_PATH);
        if (freshDb) {
          try {
            violations = sessionId ? getSessionViolations(freshDb, sessionId) : getUnresolvedViolations(freshDb);
          } finally {
            freshDb.close();
          }
        }
      } catch {
        violations = violations.filter(
          (v) => !resolution.resolvedFiles.includes(v.file_path)
        );
      }
    }
  }
  if (violations.length === 0) {
    writeHookOutput({ continue: true });
    return;
  }
  if (isTargetingIgnoredFiles(hookInput)) {
    writeHookOutput({ continue: true });
    return;
  }
  if (isFixingViolatedFile(hookInput, violations)) {
    writeHookOutput({ continue: true });
    return;
  }
  if (allViolationsAreIndirectFix(violations)) {
    const indirectGrouped = /* @__PURE__ */ new Map();
    for (const v of violations) {
      const msgs = indirectGrouped.get(v.file_path) ?? [];
      msgs.push(v.message);
      indirectGrouped.set(v.file_path, msgs);
    }
    const nudgeLines = [
      `\u26A0\uFE0F INDIRECT FIX REQUIRED \u2014 The following violations cannot be resolved by editing the flagged file (e.g. a missing test must be created as a new file). Address these BEFORE resuming your assigned task.`,
      ""
    ];
    for (const [filePath, msgs] of indirectGrouped) {
      nudgeLines.push(`File: ${filePath}`);
      for (const m of msgs) {
        nudgeLines.push(`  - ${m}`);
      }
      nudgeLines.push("");
    }
    nudgeLines.push(
      "Create or update the required fix file(s) first, then continue with your task."
    );
    writeHookOutput({
      continue: true,
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        additionalContext: nudgeLines.join("\n")
      }
    });
    return;
  }
  const pluginResult = await runPlugins("pre-tool-use", hookInput, null);
  const grouped = /* @__PURE__ */ new Map();
  for (const v of violations) {
    const msgs = grouped.get(v.file_path) ?? [];
    msgs.push(v.message);
    grouped.set(v.file_path, msgs);
  }
  const lines = [
    `\u{1F6AB} Outstanding violations must be fixed before using other tools.`,
    ""
  ];
  for (const [filePath, msgs] of grouped) {
    lines.push(`File: ${filePath}`);
    for (const m of msgs) {
      lines.push(`  - ${m}`);
    }
    lines.push("");
  }
  lines.push("Fix the violated file(s) first, then this tool will be allowed.");
  if (pluginResult.messages.length > 0) {
    lines.push("", ...pluginResult.messages);
  }
  writeDenyOutput(lines.join("\n"));
}
main().catch(() => {
  writeHookOutput({ continue: true });
});
