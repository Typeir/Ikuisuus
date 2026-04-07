#!/usr/bin/env tsx
/**
 * @fileoverview Hook installer for the content submodule.
 *
 * Writes executable git hook files into the content repo's `.git/hooks/`
 * directory. Each installed hook is a thin bash wrapper that delegates to the
 * TypeScript hook implementations via `tsx`, keeping all logic in `.ts` files.
 *
 * Main repo hooks are managed by husky (`.husky/` directory) and are not
 * touched here. Only needs to be run once per clone.
 *
 * Usage:
 *   tsx scripts/multirepo/setup-hooks.ts
 *
 * @module multirepo/setup-hooks
 */

import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'fs';
import { resolve } from 'path';

import { CONTENT_REPO, MAIN_REPO } from './constants';

/** ANSI helpers for console output. */
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const NC = '\x1b[0m';

/**
 * Logs an informational message to stdout.
 * @param msg - The message to display.
 */
function logInfo(msg: string): void {
  console.log(`${CYAN}ℹ️  ${msg}${NC}`);
}

/**
 * Logs a success message to stdout.
 * @param msg - The message to display.
 */
function logSuccess(msg: string): void {
  console.log(`${GREEN}✅ ${msg}${NC}`);
}

/**
 * Logs an error message to stderr and exits with code 1.
 * @param msg - The error message to display.
 */
function logError(msg: string): never {
  console.error(`${RED}❌ ${msg}${NC}`);
  process.exit(1);
}

/**
 * Writes a file with the given content and marks it executable (`0o755`).
 * @param filePath - Absolute path to write.
 * @param content  - File content.
 * @param label    - Short label used in the success log line.
 */
function writeHook(filePath: string, content: string, label: string): void {
  writeFileSync(filePath, content, { encoding: 'utf8' });
  chmodSync(filePath, 0o755);
  logSuccess(`Installed ${label}`);
}

/**
 * Resolves the hooks directory for a repository, handling both regular `.git`
 * directories and `.git` files (gitdir pointer) used in submodules.
 * @param repo - Absolute path to the repository root.
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
    // Falls through to default
  }

  return resolve(gitPath, 'hooks');
}

/**
 * Entry point. Installs all content-submodule git hooks.
 */
async function main(): Promise<void> {
  if (!existsSync(resolve(CONTENT_REPO, '.git'))) {
    logInfo('Content submodule not found — nothing to install');
    process.exit(0);
  }

  const hooksDir = resolveHooksDir(CONTENT_REPO);
  mkdirSync(hooksDir, { recursive: true });
  logInfo('Installing content submodule hooks...');

  writeHook(
    resolve(hooksDir, 'pre-commit'),
    `#!/usr/bin/env bash\nexec tsx "${MAIN_REPO}/scripts/multirepo/pre-commit-warn.ts"\n`,
    'pre-commit hook (content repo)',
  );

  writeHook(
    resolve(hooksDir, 'post-commit'),
    `#!/usr/bin/env bash\nexec tsx "${MAIN_REPO}/scripts/multirepo/validate-sync.ts"\n`,
    'post-commit hook (content repo)',
  );

  writeHook(
    resolve(hooksDir, 'commit-msg'),
    `#!/usr/bin/env bash\nset -euo pipefail\nCURRENT_REPO="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0\nif [ -f "$CURRENT_REPO/.git" ]; then\n  MAIN_REPO="$(cd "$CURRENT_REPO/../.." 2>/dev/null && pwd)" || exit 0\nelse\n  MAIN_REPO="$CURRENT_REPO"\nfi\nnode "$MAIN_REPO/scripts/hooks/commit-msg.js" "$1"\n`,
    'commit-msg hook (content repo)',
  );

  console.log('');
  logInfo('Main repo hooks are managed by husky (.husky/ directory)');
  logInfo("Run 'npm run test:hooks' to verify all hooks");
}

main().catch((err: unknown) => {
  logError(String(err));
});
