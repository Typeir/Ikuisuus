import {
  resolveStaleIndirectViolations
} from "./_lib/chunk-2HYCHHHY.mjs";
import {
  PROJECT_ROOT,
  isNestedHookRun,
  readHookInput,
  writeBlockingOutput,
  writeHookOutput
} from "./_lib/chunk-5NZEGB7U.mjs";

// hooks/sessionEndMissingTests.ts
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
var EXCLUDED_PATTERNS = [
  /\.d\.ts$/,
  /\.config\.(ts|js)$/,
  /\/index\.(ts|tsx)$/,
  /\.module\.(scss|css)$/,
  /\.stories\.(ts|tsx)$/,
  /\.test\.(ts|tsx)$/,
  /\.constants\.(ts|tsx)$/
];
function git(command) {
  try {
    return execSync(command, {
      cwd: PROJECT_ROOT,
      encoding: "utf-8",
      timeout: 1e4,
      stdio: ["pipe", "pipe", "pipe"]
    }).trim();
  } catch {
    return "";
  }
}
function getNewSourceFiles() {
  const stagedAdded = git("git diff --cached --name-status -- src/");
  const untracked = git("git ls-files --others --exclude-standard -- src/");
  const stagedFiles = stagedAdded.split("\n").filter(Boolean).map((line) => line.trim().split(/\s+/)).filter((parts) => parts[0] === "A" && Boolean(parts[1])).map((parts) => parts[1]);
  const untrackedFiles = untracked.split("\n").filter(Boolean);
  const combined = /* @__PURE__ */ new Set([...stagedFiles, ...untrackedFiles]);
  return [...combined].map((f) => f.replace(/\\/g, "/")).filter((f) => /\.(ts|tsx)$/.test(f)).filter((f) => !EXCLUDED_PATTERNS.some((p) => p.test(f)));
}
function hasTestFile(sourcePath) {
  const ext = sourcePath.endsWith(".tsx") ? ".tsx" : ".ts";
  const baseName = sourcePath.replace(/\.(ts|tsx)$/, "");
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
function buildBlockReason(missing) {
  const details = missing.map((src) => {
    const ext = src.endsWith(".tsx") ? ".tsx" : ".ts";
    const base = src.replace(/\.(ts|tsx)$/, "");
    return `\u{1F4C4} ${src}
   \u2192 tests/unit/${base}.test${ext}`;
  }).join("\n\n");
  return [
    `\u{1F6AB} Missing tests for ${missing.length} newly added source file(s):`,
    "",
    details,
    "",
    "Create at least one matching test file before completing."
  ].join("\n");
}
async function main() {
  const hookInput = readHookInput();
  if (isNestedHookRun(hookInput)) {
    writeHookOutput({ continue: true });
    return;
  }
  await resolveStaleIndirectViolations();
  const newSourceFiles = getNewSourceFiles();
  if (newSourceFiles.length === 0) {
    writeHookOutput({ continue: true });
    return;
  }
  const missing = newSourceFiles.filter((f) => !hasTestFile(f));
  if (missing.length === 0) {
    writeHookOutput({ continue: true });
    return;
  }
  const reason = buildBlockReason(missing);
  writeBlockingOutput({
    continue: true,
    systemMessage: reason,
    hookSpecificOutput: {
      hookEventName: "sessionEnd",
      decision: "block",
      reason: "Missing test files for newly added source files"
    }
  });
}
main().catch(() => {
  writeHookOutput({ continue: true });
});
