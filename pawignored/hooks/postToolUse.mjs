import {
  runPlugins
} from "./_lib/chunk-PGABHGLT.mjs";
import {
  resolveStaleIndirectViolations
} from "./_lib/chunk-2HYCHHHY.mjs";
import {
  DEFAULT_DB_PATH,
  GATES_DIR,
  PAW_CONFIG_PATH,
  PROJECT_ROOT,
  __commonJS,
  __toESM,
  extractSessionId,
  getPawConfig,
  insertViolation,
  isPathIgnored,
  normalizePath,
  openDb,
  openDbReadonly,
  readHookInput,
  resolveEditedFilePath,
  resolveViolationsForFile,
  toProjectRelative,
  writeHookOutput
} from "./_lib/chunk-5NZEGB7U.mjs";

// node_modules/sisteransi/src/index.js
var require_src = __commonJS({
  "node_modules/sisteransi/src/index.js"(exports, module) {
    "use strict";
    var ESC = "\x1B";
    var CSI = `${ESC}[`;
    var beep = "\x07";
    var cursor3 = {
      to(x, y) {
        if (!y) return `${CSI}${x + 1}G`;
        return `${CSI}${y + 1};${x + 1}H`;
      },
      move(x, y) {
        let ret = "";
        if (x < 0) ret += `${CSI}${-x}D`;
        else if (x > 0) ret += `${CSI}${x}C`;
        if (y < 0) ret += `${CSI}${-y}A`;
        else if (y > 0) ret += `${CSI}${y}B`;
        return ret;
      },
      up: (count = 1) => `${CSI}${count}A`,
      down: (count = 1) => `${CSI}${count}B`,
      forward: (count = 1) => `${CSI}${count}C`,
      backward: (count = 1) => `${CSI}${count}D`,
      nextLine: (count = 1) => `${CSI}E`.repeat(count),
      prevLine: (count = 1) => `${CSI}F`.repeat(count),
      left: `${CSI}G`,
      hide: `${CSI}?25l`,
      show: `${CSI}?25h`,
      save: `${ESC}7`,
      restore: `${ESC}8`
    };
    var scroll = {
      up: (count = 1) => `${CSI}S`.repeat(count),
      down: (count = 1) => `${CSI}T`.repeat(count)
    };
    var erase3 = {
      screen: `${CSI}2J`,
      up: (count = 1) => `${CSI}1J`.repeat(count),
      down: (count = 1) => `${CSI}J`.repeat(count),
      line: `${CSI}2K`,
      lineEnd: `${CSI}K`,
      lineStart: `${CSI}1K`,
      lines(count) {
        let clear = "";
        for (let i2 = 0; i2 < count; i2++)
          clear += this.line + (i2 < count - 1 ? cursor3.up() : "");
        if (count)
          clear += cursor3.left;
        return clear;
      }
    };
    module.exports = { cursor: cursor3, scroll, erase: erase3, beep };
  }
});

// hooks/postToolUse.ts
import { spawn } from "node:child_process";
import path4 from "node:path";

// pawGates.ts
import { execFileSync } from "node:child_process";
import { existsSync as existsSync3, readFileSync as readFileSync2, readdirSync as readdirSync2 } from "node:fs";
import path3 from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// gateContext.ts
import { execSync } from "node:child_process";
import { existsSync, promises as fs, readFileSync } from "node:fs";
import path from "node:path";
var DEFAULT_EXCLUDES = [
  "node_modules",
  ".next",
  ".git",
  "coverage",
  "dist",
  ".turbo"
];
function loadExcludePatterns(rootDir) {
  const ignorePath = path.join(rootDir, ".pawignore");
  const lines = existsSync(ignorePath) ? readFileSync(ignorePath, "utf-8").split("\n") : DEFAULT_EXCLUDES;
  return lines.map((l2) => l2.trim()).filter((l2) => l2.length > 0 && !l2.startsWith("#")).map((pattern) => {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*").replace(/\?/g, "[^/]");
    return new RegExp(escaped);
  });
}
function isExcludedPath(relativePath, excludes) {
  return excludes.some((pattern) => pattern.test(relativePath));
}
function filterChangedFiles(changedFiles, excludes) {
  if (!changedFiles) return null;
  return new Set(
    [...changedFiles].map((f) => f.replace(/\\/g, "/")).filter((f) => !isExcludedPath(f, excludes))
  );
}
function getChangedFiles(rootDir) {
  const run = (cmd, cwd = rootDir) => {
    try {
      return execSync(cmd, {
        cwd,
        encoding: "utf-8",
        timeout: 1e4,
        stdio: ["pipe", "pipe", "pipe"]
      }).trim();
    } catch {
      return "";
    }
  };
  const lines = [
    run("git diff --name-only HEAD"),
    run("git diff --cached --name-only"),
    run("git ls-files --others --exclude-standard")
  ].filter(Boolean).join("\n").split("\n").filter(Boolean).map((f) => f.replace(/\\/g, "/"));
  const submodulePaths = discoverSubmodules(rootDir, run);
  for (const subPath of submodulePaths) {
    const absSubPath = path.join(rootDir, subPath);
    try {
      const subLines = [
        run("git diff --name-only HEAD", absSubPath),
        run("git diff --cached --name-only", absSubPath),
        run("git ls-files --others --exclude-standard", absSubPath)
      ].filter(Boolean).join("\n").split("\n").filter(Boolean).map((f) => `${subPath}/${f.replace(/\\/g, "/")}`);
      for (const line of subLines) lines.push(line);
    } catch {
    }
  }
  return new Set(lines);
}
function discoverSubmodules(rootDir, run) {
  const output = run("git submodule status", rootDir);
  if (!output) return [];
  return output.split("\n").filter(Boolean).map((line) => {
    const parts = line.trim().replace(/^[-+ ]/, "").split(/\s+/);
    return parts[1]?.replace(/\\/g, "/");
  }).filter((p) => Boolean(p));
}
function getStagedFiles(rootDir) {
  try {
    const output = execSync(
      "git diff --cached --name-only --diff-filter=ACMR",
      {
        cwd: rootDir,
        encoding: "utf-8",
        timeout: 1e4,
        stdio: ["pipe", "pipe", "pipe"]
      }
    ).trim();
    return new Set(
      output.split("\n").filter(Boolean).map((f) => f.replace(/\\/g, "/"))
    );
  } catch {
    return /* @__PURE__ */ new Set();
  }
}
async function walkDir(dir, rootDir, extensions, excludes, results = []) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(rootDir, full).replace(/\\/g, "/");
    if (excludes.some((pattern) => pattern.test(rel))) continue;
    if (entry.isDirectory()) {
      await walkDir(full, rootDir, extensions, excludes, results);
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(rel);
    }
  }
  return results;
}
function buildGateContext(rootDir, mode, staged = false) {
  const changedFiles = mode === "changed-only" ? staged ? getStagedFiles(rootDir) : getChangedFiles(rootDir) : null;
  return buildGateContextImpl(rootDir, mode, staged, changedFiles);
}
function buildSingleFileContext(rootDir, relativePaths) {
  const changedFiles = new Set(relativePaths.map((f) => f.replace(/\\/g, "/")));
  return buildGateContextImpl(rootDir, "changed-only", false, changedFiles);
}
function buildGateContextImpl(rootDir, mode, staged, changedFiles) {
  const fileCache = /* @__PURE__ */ new Map();
  const excludes = loadExcludePatterns(rootDir);
  const filteredChangedFiles = filterChangedFiles(changedFiles, excludes);
  return {
    rootDir,
    mode,
    changedFiles: filteredChangedFiles,
    staged,
    async targetFiles(appliesTo, scanDirs = ["src"]) {
      if (mode === "changed-only" && filteredChangedFiles) {
        return [...filteredChangedFiles].filter(
          (f) => appliesTo.some((ext) => f.endsWith(ext))
        );
      }
      const allFiles = [];
      for (const dir of scanDirs) {
        const abs = path.join(rootDir, dir);
        await walkDir(abs, rootDir, appliesTo, excludes, allFiles);
      }
      return allFiles;
    },
    async readFile(relativePath) {
      const normalized = relativePath.replace(/\\/g, "/");
      if (!fileCache.has(normalized)) {
        const content = await fs.readFile(
          path.join(rootDir, relativePath),
          "utf-8"
        );
        fileCache.set(normalized, content);
      }
      return fileCache.get(normalized);
    },
    git(command) {
      return execSync(`git ${command}`, {
        cwd: rootDir,
        encoding: "utf-8",
        timeout: 1e4,
        stdio: ["pipe", "pipe", "pipe"]
      }).trim();
    }
  };
}

// gateIgnore.ts
var DIRECTIVE_PATTERN = /(?:\/\*|\{\/\*|<!--)\s*paw:gate:([\w*-]+)(?::([\w*-]+))?\s+(ignore(?:-nextline)?)\s*(?:\*\/|\*\/\}|-->)/gi;
function parseDirectives(content) {
  const result = {
    fileLevel: /* @__PURE__ */ new Map(),
    nextLine: /* @__PURE__ */ new Map()
  };
  const lines = content.split("\n");
  for (let i2 = 0; i2 < lines.length; i2 += 1) {
    DIRECTIVE_PATTERN.lastIndex = 0;
    for (const match of lines[i2].matchAll(DIRECTIVE_PATTERN)) {
      const gateId = match[1].toLowerCase();
      const rule = match[2]?.toLowerCase() ?? "*";
      const mode = match[3];
      if (mode === "ignore") {
        if (!result.fileLevel.has(gateId)) {
          result.fileLevel.set(gateId, /* @__PURE__ */ new Set());
        }
        result.fileLevel.get(gateId).add(rule);
      } else {
        const targetLine = i2 + 2;
        if (!result.nextLine.has(targetLine)) {
          result.nextLine.set(targetLine, /* @__PURE__ */ new Map());
        }
        const lineMap = result.nextLine.get(targetLine);
        if (!lineMap.has(gateId)) {
          lineMap.set(gateId, /* @__PURE__ */ new Set());
        }
        lineMap.get(gateId).add(rule);
      }
    }
  }
  return result;
}
function isSuppressed(directives, gateId, rule, line) {
  const normalizeId = (s) => s.replace(/-/g, "").toLowerCase();
  const matchesGate = (id) => id === "*" || id === gateId || normalizeId(id) === normalizeId(gateId);
  const matchesRule = (rules) => rules.has("*") || rules.has(rule);
  for (const [id, rules] of directives.fileLevel) {
    if (matchesGate(id) && matchesRule(rules)) return true;
  }
  if (typeof line === "number") {
    const lineMap = directives.nextLine.get(line);
    if (lineMap) {
      for (const [id, rules] of lineMap) {
        if (matchesGate(id) && matchesRule(rules)) return true;
      }
    }
  }
  return false;
}
async function filterGateFindings(gateId, findings, readFile) {
  if (findings.length === 0) return findings;
  const uniqueFiles = [...new Set(findings.map((f) => f.file).filter(Boolean))];
  const directivesByFile = /* @__PURE__ */ new Map();
  await Promise.all(
    uniqueFiles.map(async (file) => {
      try {
        const content = await readFile(file);
        directivesByFile.set(file, parseDirectives(content));
      } catch {
        directivesByFile.set(file, {
          fileLevel: /* @__PURE__ */ new Map(),
          nextLine: /* @__PURE__ */ new Map()
        });
      }
    })
  );
  return findings.filter((finding) => {
    const directives = directivesByFile.get(finding.file);
    if (!directives) return true;
    return !isSuppressed(directives, gateId, finding.rule, finding.line);
  });
}

// node_modules/@clack/core/dist/index.mjs
import { styleText } from "node:util";
import { stdout, stdin } from "node:process";
import * as l from "node:readline";
import l__default from "node:readline";

// node_modules/fast-string-truncated-width/dist/index.js
var EMOJI_RE = new RegExp("[\\u{1F1E6}-\\u{1F1FF}]{2}|\\u{1F3F4}[\\u{E0061}-\\u{E007A}]{2}[\\u{E0030}-\\u{E0039}\\u{E0061}-\\u{E007A}]{1,3}\\u{E007F}|(?:\\p{Emoji}\\uFE0F\\u20E3?|\\p{Emoji_Modifier_Base}\\p{Emoji_Modifier}?|\\p{Emoji_Presentation})(?:\\u200D(?:\\p{Emoji_Modifier_Base}\\p{Emoji_Modifier}?|\\p{Emoji_Presentation}|\\p{Emoji}\\uFE0F\\u20E3?))*", "yu");
var MODIFIER_RE = new RegExp("\\p{M}+", "gu");

// node_modules/fast-wrap-ansi/lib/main.js
var ANSI_ESCAPE_BELL = "\x07";
var ANSI_CSI = "[";
var ANSI_OSC = "]";
var ANSI_ESCAPE_LINK = `${ANSI_OSC}8;;`;
var GROUP_REGEX = new RegExp(`(?:\\${ANSI_CSI}(?<code>\\d+)m|\\${ANSI_ESCAPE_LINK}(?<uri>.*)${ANSI_ESCAPE_BELL})`, "y");

// node_modules/@clack/core/dist/index.mjs
var import_sisteransi = __toESM(require_src(), 1);
import { ReadStream } from "node:tty";
var a$1 = ["up", "down", "left", "right", "space", "enter", "cancel"];
var t = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];
var settings = {
  actions: new Set(a$1),
  aliases: /* @__PURE__ */ new Map([
    // vim support
    ["k", "up"],
    ["j", "down"],
    ["h", "left"],
    ["l", "right"],
    ["", "cancel"],
    // opinionated defaults!
    ["escape", "cancel"]
  ]),
  messages: {
    cancel: "Canceled",
    error: "Something went wrong"
  },
  withGuide: true,
  date: {
    monthNames: [...t],
    messages: {
      required: "Please enter a valid date",
      invalidMonth: "There are only 12 months in a year",
      invalidDay: (n2, e) => `There are only ${n2} days in ${e}`,
      afterMin: (n2) => `Date must be on or after ${n2.toISOString().slice(0, 10)}`,
      beforeMax: (n2) => `Date must be on or before ${n2.toISOString().slice(0, 10)}`
    }
  }
};
var R = globalThis.process.platform.startsWith("win");
var CANCEL_SYMBOL = Symbol("clack:cancel");

// node_modules/@clack/prompts/dist/index.mjs
import { styleText as styleText2, stripVTControlCharacters } from "node:util";
import process$1 from "node:process";
var import_sisteransi2 = __toESM(require_src(), 1);
import { existsSync as existsSync2, lstatSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
function isUnicodeSupported() {
  if (process$1.platform !== "win32") {
    return process$1.env.TERM !== "linux";
  }
  return Boolean(process$1.env.CI) || Boolean(process$1.env.WT_SESSION) || Boolean(process$1.env.TERMINUS_SUBLIME) || process$1.env.ConEmuTask === "{cmd::Cmder}" || process$1.env.TERM_PROGRAM === "Terminus-Sublime" || process$1.env.TERM_PROGRAM === "vscode" || process$1.env.TERM === "xterm-256color" || process$1.env.TERM === "alacritty" || process$1.env.TERMINAL_EMULATOR === "JetBrains-JediTerm";
}
var unicode = isUnicodeSupported();
var unicodeOr = (o, e) => unicode ? o : e;
var S_STEP_ACTIVE = unicodeOr("\u25C6", "*");
var S_STEP_CANCEL = unicodeOr("\u25A0", "x");
var S_STEP_ERROR = unicodeOr("\u25B2", "x");
var S_STEP_SUBMIT = unicodeOr("\u25C7", "o");
var S_BAR_START = unicodeOr("\u250C", "T");
var S_BAR = unicodeOr("\u2502", "|");
var S_BAR_END = unicodeOr("\u2514", "\u2014");
var S_BAR_START_RIGHT = unicodeOr("\u2510", "T");
var S_BAR_END_RIGHT = unicodeOr("\u2518", "\u2014");
var S_RADIO_ACTIVE = unicodeOr("\u25CF", ">");
var S_RADIO_INACTIVE = unicodeOr("\u25CB", " ");
var S_CHECKBOX_ACTIVE = unicodeOr("\u25FB", "[\u2022]");
var S_CHECKBOX_SELECTED = unicodeOr("\u25FC", "[+]");
var S_CHECKBOX_INACTIVE = unicodeOr("\u25FB", "[ ]");
var S_PASSWORD_MASK = unicodeOr("\u25AA", "\u2022");
var S_BAR_H = unicodeOr("\u2500", "-");
var S_CORNER_TOP_RIGHT = unicodeOr("\u256E", "+");
var S_CONNECT_LEFT = unicodeOr("\u251C", "+");
var S_CORNER_BOTTOM_RIGHT = unicodeOr("\u256F", "+");
var S_CORNER_BOTTOM_LEFT = unicodeOr("\u2570", "+");
var S_CORNER_TOP_LEFT = unicodeOr("\u256D", "+");
var S_INFO = unicodeOr("\u25CF", "\u2022");
var S_SUCCESS = unicodeOr("\u25C6", "*");
var S_WARN = unicodeOr("\u25B2", "!");
var S_ERROR = unicodeOr("\u25A0", "x");
var MULTISELECT_INSTRUCTIONS = [
  `${styleText2("dim", "\u2191/\u2193")} to navigate`,
  `${styleText2("dim", "Space:")} select`,
  `${styleText2("dim", "Enter:")} confirm`
];
var u2 = {
  light: unicodeOr("\u2500", "-"),
  heavy: unicodeOr("\u2501", "="),
  block: unicodeOr("\u2588", "#")
};
var SELECT_INSTRUCTIONS = [
  `${styleText2("dim", "\u2191/\u2193")} to navigate`,
  `${styleText2("dim", "Enter:")} confirm`
];
var i = `${styleText2("gray", S_BAR)}  `;

// pawLogger.ts
import { appendFileSync, mkdirSync } from "node:fs";
import path2 from "node:path";
var PAW_LOGS_DIR = ".ignore/paw-logs";
var SESSION_START = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19);
var LOG_FILE = path2.join(PAW_LOGS_DIR, `paw-${SESSION_START}.log`);
var IN_HOOK_CONTEXT = !process.stdout.isTTY;
function initLogsDir() {
  try {
    mkdirSync(PAW_LOGS_DIR, { recursive: true });
  } catch {
  }
}
function writeLog(level, message2) {
  try {
    initLogsDir();
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const processId = process.pid;
    const line = `${timestamp} [${level}] [#${processId}] ${message2}
`;
    appendFileSync(LOG_FILE, line, "utf-8");
  } catch {
  }
}
function pawIntro(title) {
  writeLog("info", `[CLI] Intro: ${title}`);
  if (!IN_HOOK_CONTEXT) {
    process.stderr.write(`
\u250C\u2500 ${title}
\u2502
`);
  }
}
function pawOutro(message2) {
  writeLog("info", `[CLI] Outro: ${message2}`);
  if (!IN_HOOK_CONTEXT) {
    process.stderr.write(`\u2502
\u2514\u2500 ${message2}

`);
  }
}
function info(message2) {
  writeLog("info", message2);
  if (!IN_HOOK_CONTEXT) {
    process.stderr.write(`\u2139  ${message2}
`);
  }
}
function warn(message2) {
  writeLog("warn", message2);
  if (!IN_HOOK_CONTEXT) {
    process.stderr.write(`\u26A0 ${message2}
`);
  }
}
function error(message2) {
  writeLog("error", message2);
  if (!IN_HOOK_CONTEXT) {
    process.stderr.write(`\u2716 ${message2}
`);
  }
}
function debug(message2) {
  writeLog("debug", message2);
}
function step(message2) {
  writeLog("info", `\u2192 ${message2}`);
  if (!IN_HOOK_CONTEXT) {
    process.stderr.write(`\u2192 ${message2}
`);
  }
}
function message(message2) {
  writeLog("info", message2);
  if (!IN_HOOK_CONTEXT) {
    process.stderr.write(`${message2}
`);
  }
}

// pawGates.ts
function parseArgs() {
  const args = process.argv.slice(2);
  const staged = args.includes("--staged");
  const changedOnly = args.includes("--changed-only") || staged;
  let gateNames;
  const gatesIdx = args.indexOf("--gates");
  if (gatesIdx !== -1 && args[gatesIdx + 1]) {
    gateNames = args[gatesIdx + 1].split(",").map((s) => s.trim()).filter(Boolean);
  }
  let port;
  const portIdx = args.indexOf("--port");
  if (portIdx !== -1 && args[portIdx + 1]) {
    port = args[portIdx + 1];
  }
  return {
    mode: changedOnly ? "changed-only" : "full",
    staged,
    gateNames,
    port
  };
}
function splitRunnerCommand(runner) {
  const parts = runner.split(" ");
  return { command: parts[0], args: parts.slice(1) };
}
function ensureGateStats(result) {
  if (!result.stats) {
    result.stats = { filesChecked: 0, findingsCount: 0, durationMs: 0 };
  }
}
var DEFAULT_RUNNERS = { ".gate.ts": "import" };
function loadRunnerConfig() {
  if (!existsSync3(PAW_CONFIG_PATH)) return DEFAULT_RUNNERS;
  try {
    const raw = readFileSync2(PAW_CONFIG_PATH, "utf-8");
    const config = JSON.parse(raw);
    if (config.runners && typeof config.runners === "object") {
      return config.runners;
    }
  } catch {
  }
  return DEFAULT_RUNNERS;
}
function matchRunner(filename, runners) {
  for (const suffix of Object.keys(runners)) {
    if (filename.endsWith(suffix)) return suffix;
  }
  return null;
}
function runSubprocessGate(runner, gatePath, context) {
  const stdinPayload = JSON.stringify({
    rootDir: context.rootDir,
    mode: context.mode,
    changedFiles: context.changedFiles ? [...context.changedFiles] : null
  });
  const { command, args: runnerArgs } = splitRunnerCommand(runner);
  debug(
    `Subprocess: command="${command}", args=[${runnerArgs.join(", ")}], gate="${gatePath}"`
  );
  try {
    const stdout2 = execFileSync(command, [...runnerArgs, gatePath], {
      cwd: context.rootDir,
      input: stdinPayload,
      encoding: "utf-8",
      timeout: 12e4,
      stdio: ["pipe", "pipe", "pipe"]
    });
    debug(
      `Subprocess stdout (first 200 chars): ${stdout2.substring(0, 200)}`
    );
    const result = JSON.parse(stdout2);
    return result;
  } catch (err) {
    const error2 = err;
    error(
      `Subprocess execution error: code=${error2.code}, signal=${error2.signal}`
    );
    error(`Error message: ${error2.message}`);
    if (error2.stderr) {
      error(`Subprocess stderr: ${error2.stderr.substring(0, 500)}`);
    }
    throw err;
  }
}
async function discoverGates(gateNames) {
  const runners = loadRunnerConfig();
  info(`Gate runners config: ${JSON.stringify(runners)}`);
  let allFiles;
  try {
    allFiles = readdirSync2(GATES_DIR).filter(
      (f) => matchRunner(f, runners) !== null
    );
    info(
      `Discovered ${allFiles.length} gate files: ${allFiles.join(", ")}`
    );
  } catch {
    warn(`No gates/ directory found at ${GATES_DIR}`);
    return [];
  }
  const files = gateNames ? allFiles.filter((f) => {
    const id = f.replace(/\.gate\.\w+$/, "");
    return gateNames.includes(id);
  }) : allFiles;
  info(
    `Processing ${files.length} gates (filtered by names: ${gateNames ? gateNames.join(", ") : "none"})`
  );
  const gates = [];
  for (const file of files) {
    const suffix = matchRunner(file, runners);
    const runnerCmd = runners[suffix];
    const gateId = file.replace(/\.gate\.\w+$/, "");
    info(
      `[${gateId}] File: ${file}, suffix: ${suffix}, runner: ${runnerCmd}`
    );
    try {
      if (runnerCmd === "import") {
        info(`[${gateId}] Loading via import`);
        const modulePath = pathToFileURL(path3.join(GATES_DIR, file)).href;
        debug(`[${gateId}] Module path: ${modulePath}`);
        const mod = await import(modulePath);
        if (mod.gate && typeof mod.gate.check === "function") {
          gates.push(mod.gate);
          info(`[${gateId}] \u2713 Loaded successfully`);
        } else {
          warn(
            `[${gateId}] Does not export valid 'gate' constant (exports: ${Object.keys(mod).join(", ")})`
          );
        }
      } else {
        const gatePath = path3.join(GATES_DIR, file);
        info(
          `[${gateId}] Loading via subprocess runner: "${runnerCmd}"`
        );
        debug(`[${gateId}] Gate path: ${gatePath}`);
        const { command: cmdPart, args: restParts } = splitRunnerCommand(runnerCmd);
        debug(
          `[${gateId}] Runner split: cmd="${cmdPart}", args=[${restParts.join(", ")}]`
        );
        const resolvedCmd = cmdPart.includes(path3.sep) || cmdPart.includes("/") ? cmdPart.startsWith("/") || cmdPart[1] === ":" ? cmdPart : path3.resolve(PROJECT_ROOT, cmdPart) : cmdPart;
        debug(
          `[${gateId}] Resolved cmd: "${resolvedCmd}" (original: "${cmdPart}")`
        );
        const resolvedRunner = [resolvedCmd, ...restParts].join(" ");
        info(
          `[${gateId}] \u2713 Ready for subprocess execution: "${resolvedRunner}"`
        );
        gates.push({
          id: gateId,
          name: gateId,
          port: "custom",
          severity: "critical",
          appliesTo: [],
          async check(context) {
            info(`[${gateId}] Executing subprocess gate`);
            try {
              const result = await runSubprocessGate(
                resolvedRunner,
                gatePath,
                context
              );
              debug(
                `[${gateId}] Result: ${JSON.stringify(result).substring(0, 100)}...`
              );
              return result;
            } catch (err) {
              error(
                `[${gateId}] Subprocess execution failed: ${err.message}`
              );
              throw err;
            }
          }
        });
      }
    } catch (err) {
      error(
        `[${gateId}] Failed to load ${file}: ${err.message}`
      );
    }
  }
  info(
    `Gate discovery complete: ${gates.length}/${files.length} gates loaded successfully`
  );
  return gates;
}
function resolveExecutionOrder(gates) {
  const byId = new Map(gates.map((g) => [g.id, g]));
  const visited = /* @__PURE__ */ new Set();
  const sorted = [];
  const visiting = /* @__PURE__ */ new Set();
  function visit(gate) {
    if (visited.has(gate.id)) return;
    if (visiting.has(gate.id)) {
      throw new Error(`Dependency cycle detected involving gate: ${gate.id}`);
    }
    visiting.add(gate.id);
    for (const depId of gate.dependsOn ?? []) {
      const dep = byId.get(depId);
      if (dep) visit(dep);
    }
    visiting.delete(gate.id);
    visited.add(gate.id);
    sorted.push(gate);
  }
  for (const gate of gates) visit(gate);
  return sorted;
}
async function orchestrate(rootDir, mode, staged, gateNames, port) {
  const context = buildGateContext(rootDir, mode, staged);
  return orchestrateWithContext(context, gateNames, port);
}
async function orchestrateWithContext(context, gateNames, port) {
  if (context.mode === "changed-only" && context.changedFiles && context.changedFiles.size === 0) {
    return {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      mode: context.mode,
      changedFiles: [],
      overall: "PASS",
      summary: {
        totalGates: 0,
        passed: 0,
        failed: 0,
        totalFindings: 0,
        hasCritical: false
      },
      gates: []
    };
  }
  let gates = await discoverGates(gateNames);
  if (port) {
    gates = gates.filter((g) => g.port === port);
  }
  const ordered = resolveExecutionOrder(gates);
  const results = [];
  let hasCritical = false;
  for (const gate of ordered) {
    const start = performance.now();
    try {
      const result = await gate.check(context);
      ensureGateStats(result);
      result.stats.durationMs = Math.round(performance.now() - start);
      result.findings = await filterGateFindings(
        gate.id,
        result.findings,
        (rel) => context.readFile(rel)
      );
      result.passed = result.findings.length === 0;
      results.push(result);
      if (!result.passed && result.severity === "critical") {
        hasCritical = true;
      }
    } catch (err) {
      const durationMs = Math.round(performance.now() - start);
      results.push({
        gate: gate.id,
        passed: false,
        severity: "critical",
        findings: [
          {
            file: gate.id,
            rule: "gate-error",
            message: err.message?.substring(0, 300) ?? "Unknown error",
            suggestion: "Check gate implementation"
          }
        ],
        stats: { filesChecked: 0, findingsCount: 1, durationMs }
      });
      hasCritical = true;
    }
  }
  return {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    mode: context.mode,
    changedFiles: context.changedFiles ? [...context.changedFiles] : null,
    overall: hasCritical ? "FAIL" : "PASS",
    summary: {
      totalGates: results.length,
      passed: results.filter((r2) => r2.passed).length,
      failed: results.filter((r2) => !r2.passed).length,
      totalFindings: results.reduce((sum, r2) => sum + r2.findings.length, 0),
      hasCritical
    },
    gates: results
  };
}
async function runGatesForFiles(rootDir, relativePaths, options) {
  const context = buildSingleFileContext(rootDir, relativePaths);
  return orchestrateWithContext(context, options?.gateNames, options?.port);
}
async function main() {
  const { mode, staged, gateNames, port } = parseArgs();
  const modeLabel = staged ? "(staged files only)" : mode === "changed-only" ? "(diff-scoped)" : "(full codebase)";
  const filterLabel = gateNames ? ` [gates: ${gateNames.join(", ")}]` : port ? ` [port: ${port}]` : "";
  pawIntro(`PAW Health Check ${modeLabel}${filterLabel}`);
  const report = await orchestrate(PROJECT_ROOT, mode, staged, gateNames, port);
  step(`Overall: ${report.overall}`);
  info(
    `Gates: ${report.summary.passed}/${report.summary.totalGates} passed`
  );
  info(`Findings: ${report.summary.totalFindings}`);
  if (report.summary.hasCritical) {
    error("CRITICAL issues found \u2014 completion is BLOCKED.");
    for (const gr of report.gates.filter(
      (r2) => r2.severity === "critical" && !r2.passed
    )) {
      error(`${gr.gate}:`);
      for (const f of gr.findings.slice(0, 10)) {
        const loc = f.line ? `:${f.line}` : "";
        message(`  ${f.file}${loc} \u2014 ${f.message}`);
      }
      if (gr.findings.length > 10) {
        message(`  ... and ${gr.findings.length - 10} more`);
      }
    }
  }
  console.log("\n---JSON_REPORT_START---");
  console.log(JSON.stringify(report, null, 2));
  console.log("---JSON_REPORT_END---");
  pawOutro(
    report.summary.hasCritical ? "Health check FAILED" : "Health check PASSED"
  );
  process.exit(report.summary.hasCritical ? 1 : 0);
}
var isDirectRun = process.argv[1] !== void 0 && fileURLToPath(import.meta.url) === path3.resolve(process.argv[1]) && /paw.?gates|health.?check/i.test(path3.basename(process.argv[1]));
if (isDirectRun) {
  main().catch((err) => {
    error(`Fatal: ${err.message}`);
    process.exit(1);
  });
}

// hooks/postToolUse.ts
async function writeViolations(filePath, findings, sessionId) {
  try {
    const db = await openDb(DEFAULT_DB_PATH);
    try {
      for (const finding of findings) {
        insertViolation(db, {
          filePath: normalizePath(finding.file ?? filePath),
          rule: finding.rule,
          message: finding.message,
          hookEvent: "postToolUse",
          sessionId: sessionId ?? void 0,
          indirectFix: finding.indirectFix
        });
      }
    } finally {
      db.close();
    }
  } catch {
  }
}
async function clearViolations(filePath, sessionId) {
  try {
    const db = await openDb(DEFAULT_DB_PATH);
    try {
      resolveViolationsForFile(db, normalizePath(filePath), null);
      if (sessionId) {
        resolveViolationsForFile(db, normalizePath(filePath), sessionId);
      }
    } finally {
      db.close();
    }
  } catch {
  }
}
function spawnMemoryWorker(relativePath, sessionId) {
  return new Promise((resolve) => {
    try {
      const workerPath = path4.join(
        PROJECT_ROOT,
        ".github",
        "PAW",
        "hooks",
        "memory-worker.ts"
      );
      const tsconfigPath = path4.join(PROJECT_ROOT, ".paw", "tsconfig.json");
      const tsxCli = path4.join(PROJECT_ROOT, "node_modules", "tsx", "dist", "cli.mjs");
      const isWindows = process.platform === "win32";
      const spawnOpts = {
        cwd: PROJECT_ROOT,
        stdio: "ignore",
        windowsHide: true
      };
      if (!isWindows) {
        spawnOpts.detached = true;
      }
      const child = spawn(
        process.execPath,
        [
          tsxCli,
          "--tsconfig",
          tsconfigPath,
          workerPath,
          relativePath,
          ...sessionId ? [sessionId] : []
        ],
        spawnOpts
      );
      if (isWindows) {
        child.on("exit", () => resolve());
        child.on("error", () => resolve());
      } else {
        child.unref();
        resolve();
      }
    } catch {
      resolve();
    }
  });
}
async function main2() {
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
  const hookInput = readHookInput();
  const filePath = resolveEditedFilePath(hookInput);
  const sessionId = extractSessionId(hookInput);
  if (!filePath) {
    writeHookOutput({ continue: true });
    return;
  }
  const fileForward = filePath.replace(/\\/g, "/");
  const rootForward = PROJECT_ROOT.replace(/\\/g, "/");
  const isAbsolutePath = /^[a-zA-Z]:\//.test(fileForward) || fileForward.startsWith("/");
  if (isAbsolutePath && !fileForward.toLowerCase().startsWith(rootForward.toLowerCase() + "/") && fileForward.toLowerCase() !== rootForward.toLowerCase()) {
    writeHookOutput({ continue: true });
    return;
  }
  const relativePath = toProjectRelative(filePath);
  if (isPathIgnored(relativePath)) {
    await clearViolations(relativePath, sessionId);
    writeHookOutput({ continue: true });
    return;
  }
  const report = await runGatesForFiles(PROJECT_ROOT, [relativePath]);
  const criticalFindings = report.gates.filter((g) => !g.passed && g.severity === "critical").flatMap((g) => g.findings);
  if (criticalFindings.length === 0) {
    await clearViolations(relativePath, sessionId);
    await resolveStaleIndirectViolations(sessionId);
    writeHookOutput({ continue: true });
    await spawnMemoryWorker(relativePath, sessionId);
    return;
  }
  await clearViolations(relativePath, sessionId);
  await writeViolations(relativePath, criticalFindings, sessionId);
  const pluginResult = await runPlugins("post-tool-use", hookInput, null);
  const message2 = [
    `\u26A0\uFE0F Gate violations in ${relativePath}:`,
    ...criticalFindings.slice(0, 10).map((f) => {
      const fileLabel = f.file && f.file !== relativePath ? ` (${f.file})` : "";
      const loc = f.line ? `:${f.line}` : "";
      return `  - [${f.rule}] ${f.message}${fileLabel}${loc}`;
    }),
    criticalFindings.length > 10 ? `  ... and ${criticalFindings.length - 10} more` : "",
    "",
    "Fix these before continuing."
  ].filter(Boolean).join("\n");
  writeHookOutput({
    continue: true,
    decision: "block",
    reason: message2,
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: message2
    }
  });
  await spawnMemoryWorker(relativePath, sessionId);
}
main2().catch((err) => {
  process.stderr.write(
    `PAW postToolUse error: ${err instanceof Error ? err.message : String(err)}
`
  );
  writeHookOutput({ continue: true });
});
