/**
 * @fileoverview `ik setup` — One-shot bootstrap for a fresh clone.
 *
 * Cross-platform setup that:
 *
 *   1. Installs a PATH-resolvable `ik` shim so users can invoke `ik` from any
 *      directory without typing `npx tsx ...`.
 *   2. Configures the content submodule to merge (not detach) on update.
 *   3. Installs content-repo git hooks via `setup-hooks.ts::main`.
 *   4. Triggers `paw sync` to populate `.paw/hooks/` and `.github/hooks/`.
 *
 * Idempotent: re-running detects managed blocks (sentinel-delimited) in rc
 * files and replaces them instead of appending duplicates.
 *
 * @module multirepo/commands/setup
 * @author Typeir

 * @version 1.0.0
 * @since 3.0.0
 */

import { log, spinner } from '@clack/prompts';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { resolve } from 'node:path';

import { ensurePawCli, PAW_CLI_PATH } from '../../../.github/PAW/pawBootstrap';
import type { CommandMeta } from '../../utils/cli-loader';
import { MAIN_REPO } from '../constants';
import { attachContentToBranch } from '../git';
import { main as installContentHooks } from '../setup-hooks';

/** Command metadata for the fs-based loader. */
export const meta: CommandMeta = {
  name: 'setup',
  description: 'Bootstrap a fresh clone (PATH shim, hooks, submodule, PAW)',
};

/** Sentinel markers that delimit ik-managed blocks in rc files. */
const BEGIN_MARK = '# >>> ik managed block >>>';
const END_MARK = '# <<< ik managed block <<<';

/**
 * Builds the POSIX shell function block that exposes `ik` on the PATH.
 * @param {string} repoRoot - Absolute path to the main repo root.
 * @returns {string} Multi-line shell snippet with sentinels.
 */
function buildPosixBlock(repoRoot: string): string {
  const body = `ik() {\n  npx tsx --tsconfig "${repoRoot}/tsconfig.scripts.json" "${repoRoot}/scripts/multirepo/ik.ts" "$@"\n}`;
  return `${BEGIN_MARK}\n${body}\n${END_MARK}`;
}

/**
 * Writes or replaces the ik-managed block in a single rc file.
 * @param {string} rcPath - Absolute path to the rc file.
 * @param {string} block - Pre-formatted block including sentinels.
 * @returns {boolean} `true` when the file was modified.
 */
function upsertRcBlock(rcPath: string, block: string): boolean {
  try {
    const existing = existsSync(rcPath) ? readFileSync(rcPath, 'utf8') : '';
    const pattern = new RegExp(
      `${BEGIN_MARK.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}[\\s\\S]*?${END_MARK.replace(
        /[-/\\^$*+?.()|[\]{}]/g,
        '\\$&',
      )}`,
      'g',
    );
    const next = pattern.test(existing)
      ? existing.replace(pattern, block)
      : `${existing.replace(/\n*$/, '\n\n')}${block}\n`;
    if (next === existing) {
      return false;
    }
    writeFileSync(rcPath, next, { encoding: 'utf8' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Installs the `ik` shim on POSIX systems by inserting a shell function into
 * `~/.bashrc`, `~/.bash_profile`, and `~/.zshrc` (when they exist).
 * @param {string} repoRoot - Absolute path to the main repo root.
 * @returns {string | null} Error message if all files missing, null otherwise.
 */
function installPosixShim(repoRoot: string): string | null {
  const home = homedir();
  const block = buildPosixBlock(repoRoot);
  const candidates = ['.bashrc', '.bash_profile', '.zshrc', '.profile'];
  let found = false;
  for (const name of candidates) {
    const path = resolve(home, name);
    if (!existsSync(path)) {
      continue;
    }
    found = true;
    upsertRcBlock(path, block);
  }
  if (!found) {
    return `No shell rc files found (.bashrc, .bash_profile, .zshrc, .profile)`;
  }
  return null;
}

/**
 * Installs the `ik` shim on Windows by writing `%USERPROFILE%\.ik\ik.cmd` and
 * prepending that folder to the user PATH via `setx`.
 * @param {string} repoRoot - Absolute path to the main repo root.
 * @returns {string | null} Error message if failed, null otherwise.
 */
function installWindowsShim(repoRoot: string): string | null {
  const ikDir = resolve(homedir(), '.ik');
  mkdirSync(ikDir, { recursive: true });

  const cmdPath = resolve(ikDir, 'ik.cmd');
  const cmdBody = `@echo off\r\nnpx tsx --tsconfig "${repoRoot}\\tsconfig.scripts.json" "${repoRoot}\\scripts\\multirepo\\ik.ts" %*\r\n`;
  writeFileSync(cmdPath, cmdBody, { encoding: 'utf8' });

  const currentPath = process.env.PATH ?? '';
  if (currentPath.toLowerCase().includes(ikDir.toLowerCase())) {
    return null;
  }

  const setxResult = spawnSync('setx', ['PATH', `${ikDir};%PATH%`], {
    stdio: 'pipe',
  });
  if (setxResult.status !== 0) {
    const stderr = setxResult.stderr?.toString() ?? 'unknown error';
    return `setx failed: ${stderr.trim()}. Add "${ikDir}" to PATH manually.`;
  }
  return null;
}

/**
 * Configures the content submodule to merge upstream changes rather than
 * detach HEAD on `git submodule update`.
 * @param {string} repoRoot - Absolute path to the main repo root.
 * @returns {void}
 */
function configureSubmodule(repoRoot: string): void {
  spawnSync(
    'git',
    ['-C', repoRoot, 'config', 'submodule.src/content.update', 'merge'],
    { stdio: 'pipe' },
  );
}

/**
 * Initializes and updates all submodules (including PAW).
 * @param {string} repoRoot - Absolute path to the main repo root.
 * @returns {void}
 */
function initializeSubmodules(repoRoot: string): void {
  spawnSync('git', ['-C', repoRoot, 'submodule', 'init'], { stdio: 'pipe' });
  spawnSync(
    'git',
    ['-C', repoRoot, 'submodule', 'update', '--init', '--recursive'],
    { stdio: 'pipe' },
  );
}

/**
 * Runs `paw sync` to populate the hook bundles, building the CLI first if
 * the compiled artifact is not yet present.
 * @param {string} repoRoot - Absolute path to the main repo root.
 * @returns {string | null} Error message if failed, null otherwise.
 */
function runPawSync(repoRoot: string): string | null {
  const prepErr = ensurePawCli();
  if (prepErr) {
    return prepErr;
  }

  try {
    const result = spawnSync('node', [PAW_CLI_PATH, 'sync'], {
      cwd: repoRoot,
      stdio: 'pipe',
      timeout: 30000,
    });
    if (result.status !== 0) {
      const stderr = result.stderr?.toString() ?? '';
      if (stderr.includes('ERR_MODULE_NOT_FOUND')) {
        return 'PAW sync failed: runtime dependency missing after build';
      }
      return 'paw sync failed';
    }
  } catch (error) {
    return `PAW sync error: ${String(error)}`;
  }
  return null;
}

/**
 * Runs the full setup flow.
 * @param {string[]} _args - Ignored; accepted for CliCommand signature.
 * @returns {Promise<void>}
 */
export async function run(_args: string[]): Promise<void> {
  const s = spinner();
  const repoRoot = MAIN_REPO;

  s.start('Installing ik PATH shim');
  const windowsErr =
    platform() === 'win32' ? installWindowsShim(repoRoot) : null;
  const posixErr = installPosixShim(repoRoot);
  if (windowsErr || posixErr) {
    s.stop('PATH shim installed (with warnings)');
    if (windowsErr) log.error(windowsErr);
    if (posixErr) log.error(posixErr);
  } else {
    s.stop('PATH shim installed');
  }

  s.start('Configuring content submodule');
  configureSubmodule(repoRoot);
  s.stop('Submodule configured (merge on update)');

  s.start('Initializing submodules');
  initializeSubmodules(repoRoot);
  s.stop('Submodules initialized');

  attachContentToBranch();

  s.start('Installing content-repo git hooks');
  let hookErr: string | null = null;
  try {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWrite = process.stdout.write.bind(process.stdout);
    const stderrWrite = process.stderr.write.bind(process.stderr);

    console.log = () => {};
    console.error = () => {};
    process.stdout.write = () => true;
    process.stderr.write = () => true;

    try {
      await installContentHooks();
    } finally {
      console.log = originalLog;
      console.error = originalError;
      process.stdout.write = originalWrite;
      process.stderr.write = stderrWrite;
    }

    s.stop('Content hooks installed');
  } catch (error) {
    hookErr = String(error);
    s.stop('Content hooks skipped');
    log.error(hookErr);
  }

  s.start('Syncing PAW hooks');
  const pawErr = runPawSync(repoRoot);
  if (pawErr) {
    s.stop('PAW synced (with warnings)');
    log.error(pawErr);
  } else {
    s.stop('PAW synced');
  }

  log.success('ik setup complete — open a new shell and run `ik help`.');
}
