#!/usr/bin/env tsx
/**
 * @fileoverview Installs git hooks into the content repo's `.git/hooks/`
 * directory.
 *
 * @module scripts/multirepo/setup-hooks
 * @author Typeir
 * @version 1.2.0
 * @since 2.0.0
 */

import {
    chmodSync,
    existsSync,
    mkdirSync,
    readFileSync,
    statSync,
    writeFileSync,
} from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

import { CONTENT_REPO } from './constants';

/** ANSI helpers for console output. */
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const NC = '\x1b[0m';

/**
 * Logs an informational message to stdout.
 * @param {string} msg - The message to display.
 */
function logInfo(msg: string): void {
  process.stdout.write(`${CYAN}ℹ️  ${msg}${NC}\n`);
}

/**
 * Logs a success message to stdout.
 * @param {string} msg - The message to display.
 */
function logSuccess(msg: string): void {
  process.stdout.write(`${GREEN}✅ ${msg}${NC}\n`);
}

/**
 * Logs an error message to stderr and exits with code 1.
 * @param {string} msg - The error message to display.
 */
function logError(msg: string): never {
  console.error(`${RED}❌ ${msg}${NC}`);
  process.exit(1);
}

/**
 * Writes a file with the given content and marks it executable (`0o755`).
 * @param {string} filePath - Absolute path to write.
 * @param {string} content  - File content.
 * @param {string} label    - Short label used in the success log line.
 */
function writeHook(filePath: string, content: string, label: string): void {
  writeFileSync(filePath, content, { encoding: 'utf8' });
  chmodSync(filePath, 0o755);
  logSuccess(`Installed ${label}`);
}

/**
 * Resolves the hooks directory for a repository, handling both regular `.git`
 * directories and `.git` files (gitdir pointer) used in submodules.
 * @param {string} repo - Absolute path to the repository root.
 * @returns Absolute path to the hooks directory.
 */
function resolveHooksDir(repo: string): string {
  const gitPath = resolve(repo, '.git');

  try {
    const stat = statSync(gitPath);
    if (stat.isFile()) {
      const pointer = readFileSync(gitPath, 'utf8')
        .replace(/^gitdir:\s*/, '')
        .trim();
      return resolve(repo, pointer, 'hooks');
    }
  } catch {
    /* gitPath does not exist — fall through to default */
  }

  return resolve(gitPath, 'hooks');
}

/** Shell prelude that resolves the main repo root from the committing repo. */
const REPO_PRELUDE = [
  '#!/usr/bin/env bash',
  'set -euo pipefail',
  'CURRENT_REPO="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0',
  'if [ -f "$CURRENT_REPO/.git" ]; then',
  '  MAIN_REPO="$(cd "$CURRENT_REPO/../.." 2>/dev/null && pwd)" || exit 0',
  'else',
  '  MAIN_REPO="$CURRENT_REPO"',
  'fi',
].join('\n');

/**
 * Builds an advisory hook that runs a `scripts/multirepo` entry point under the
 * main repo's local `tsx`, exiting quietly when no `tsx` binary is available.
 * @param {string} script - Script basename under `scripts/multirepo`.
 * @returns The hook file content.
 */
function multirepoHook(script: string): string {
  return [
    REPO_PRELUDE,
    'TSX="$MAIN_REPO/node_modules/.bin/tsx"',
    '[ -x "$TSX" ] || TSX="$(command -v tsx || true)"',
    `[ -n "$TSX" ] || { echo "multirepo ${script} hook skipped: tsx not found" >&2; exit 0; }`,
    `exec "$TSX" "$MAIN_REPO/scripts/multirepo/${script}.ts"`,
    '',
  ].join('\n');
}

/**
 * Entry point.
 * @returns {Promise<void>}
 */
export async function main(): Promise<void> {
  if (!existsSync(resolve(CONTENT_REPO, '.git'))) {
    logInfo('Content submodule not found — nothing to install');
    process.exit(0);
  }

  const hooksDir = resolveHooksDir(CONTENT_REPO);
  mkdirSync(hooksDir, { recursive: true });
  logInfo('Installing content submodule hooks...');

  writeHook(
    resolve(hooksDir, 'pre-commit'),
    multirepoHook('pre-commit-warn'),
    'pre-commit hook (content repo)',
  );

  writeHook(
    resolve(hooksDir, 'post-commit'),
    multirepoHook('validate-sync'),
    'post-commit hook (content repo)',
  );

  writeHook(
    resolve(hooksDir, 'commit-msg'),
    `${REPO_PRELUDE}\nnpx tsx --tsconfig "$MAIN_REPO/tsconfig.scripts.json" "$MAIN_REPO/.paw/git-hooks/commit-msg.ts" "$1"\n`,
    'commit-msg hook (content repo)',
  );

  process.stdout.write('\n');
  logInfo('Main repo hooks are managed by PAW (.github/PAW/)');
  logInfo("Run 'npm run paw:hooks status' to verify all hooks");
}

/**
 * Executes `main()` when invoked directly via
 * `tsx scripts/multirepo/setup-hooks.ts`.
 */
const invokedDirectly =
  fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? '');

if (invokedDirectly) {
  main().catch((err: unknown) => {
    logError(String(err));
  });
}
