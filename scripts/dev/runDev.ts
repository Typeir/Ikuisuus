#!/usr/bin/env tsx
/**
 * @fileoverview Runs local dev with explicit metadata backend controls.
 *
 * Behavior:
 * - Default backend: fs
 * - `--pg`: force pg backend
 * - `--fs`: force fs backend
 * - `--no-preinit`: skip pre-init pipeline
 * - `--no-replace`: do not auto-stop an existing same-project Next dev process
 * - Any other args are passed through to `next dev`
 *
 * @module scripts/dev/runDev
 * @version 1.1.1
 * @author Typeir
 * @since 2025-01-01
 */
import { createLogger } from '@/lib/logging/logger';
import { spawn } from 'child_process';
import { readFile, stat } from 'fs/promises';
import path from 'path';
import { startLocaleWatcher } from './watchLocales';

const log = createLogger({ script: 'runDev' });

/**
 * Runs a command and resolves with its exit code.
 *
 * @param {string} command - Executable name.
 * @param {string[]} args - Argument list.
 * @param {NodeJS.ProcessEnv} [env] - Optional env overrides.
 * @returns {Promise<number>} Process exit code.
 */
function runCommand(
  command: string,
  args: string[],
  env?: NodeJS.ProcessEnv,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: env ? { ...process.env, ...env } : process.env,
    });

    const forward = (sig: NodeJS.Signals) => {
      try {
        child.kill(sig);
      } catch {}
    };
    process.on('SIGINT', forward);
    process.on('SIGTERM', forward);

    child.on('error', (err) => reject(err));
    child.on('close', (code) => resolve(typeof code === 'number' ? code : 1));
  });
}

/**
 * Returns whether the given file path exists.
 *
 * @param {string} filePath - File path to check.
 * @returns {Promise<boolean>} True if the file exists.
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Pauses execution for the given duration.
 *
 * @param {number} ms - Delay in milliseconds.
 * @returns {Promise<void>} Promise resolved after the delay.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Returns whether a process ID is currently alive.
 *
 * @param {number} pid - Process ID to probe.
 * @returns {boolean} True when the process exists.
 */
function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads Next dev lock file and extracts a PID when available.
 *
 * @param {string} projectRoot - Project root directory.
 * @returns {Promise<number | null>} Existing Next dev PID or null.
 */
async function readNextDevLockPid(projectRoot: string): Promise<number | null> {
  const lockPath = path.resolve(projectRoot, '.next', 'dev', 'lock');
  const exists = await fileExists(lockPath);
  if (!exists) {
    return null;
  }

  const raw = await readFile(lockPath, 'utf8');
  if (!raw.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { pid?: unknown };
    if (
      typeof parsed.pid === 'number' &&
      Number.isInteger(parsed.pid) &&
      parsed.pid > 0
    ) {
      return parsed.pid;
    }
  } catch {
    const match = raw.match(/"pid"\s*:\s*(\d+)/);
    if (match) {
      return Number(match[1]);
    }
  }

  return null;
}

/**
 * Gracefully stops a process, then force-kills if it does not exit in time.
 *
 * @param {number} pid - Process ID to stop.
 * @param {number} [graceMs=4000] - Grace period before force kill.
 * @returns {Promise<boolean>} True if a process was targeted and is no longer alive.
 */
async function stopProcessGracefully(
  pid: number,
  graceMs = 4000,
): Promise<boolean> {
  if (!isPidAlive(pid)) {
    return false;
  }

  try {
    process.kill(pid, 'SIGTERM');
  } catch {
    return false;
  }

  const startedAt = Date.now();
  while (Date.now() - startedAt < graceMs) {
    if (!isPidAlive(pid)) {
      return true;
    }
    await sleep(150);
  }

  if (!isPidAlive(pid)) {
    return true;
  }

  try {
    process.kill(pid, 'SIGKILL');
  } catch {
    return false;
  }

  const forceStartedAt = Date.now();
  while (Date.now() - forceStartedAt < 2000) {
    if (!isPidAlive(pid)) {
      return true;
    }
    await sleep(100);
  }

  return !isPidAlive(pid);
}

/**
 * Runs pre-init and starts `next dev` with requested backend semantics.
 */
async function main() {
  const rawArgs = process.argv.slice(2);
  const controlFlags = new Set([
    '--pg',
    '--fs',
    '--no-preinit',
    '--no-replace',
  ]);
  const nextArgs = rawArgs.filter((arg) => !controlFlags.has(arg));
  const usePg = rawArgs.includes('--pg');
  const forceFs = rawArgs.includes('--fs');
  const skipPreInit = rawArgs.includes('--no-preinit');
  const disableReplace = rawArgs.includes('--no-replace');
  if (usePg && forceFs) {
    log.error('Use either --pg or --fs, not both.');
    process.exit(1);
  }

  const metadataBackend = usePg ? 'pg' : 'fs';
  const contentFetchMode = forceFs ? 'build' : 'runtime';

  /* Pre-init must run under the SAME backend as the dev server it precedes.
     Without the override, generators fall back to .env.local (pg) and write
     sidecars to .meta/ while an fs-mode server reads the stale
     source-adjacent ones — the two silently diverge. */
  const backendEnv: NodeJS.ProcessEnv = {
    METADATA_BACKEND: metadataBackend,
    CONTENT_FETCH_MODE: contentFetchMode,
  };

  if (!skipPreInit) {
    log.message('Running pre-init...');
    const code = await runCommand('npm', ['run', 'pre-init'], backendEnv);
    if (code !== 0) {
      log.error(`pre-init failed with exit code ${code}`);
      process.exit(code);
    }
  } else {
    log.message('Skipping pre-init (passed --no-preinit)');
  }

  let nextExitCode: number;

  if (!disableReplace) {
    const existingPid = await readNextDevLockPid(process.cwd());
    if (existingPid && existingPid !== process.pid && isPidAlive(existingPid)) {
      log.message(`Stopping existing Next dev process PID ${existingPid}...`);
      const stopped = await stopProcessGracefully(existingPid);
      if (!stopped) {
        log.warning(
          `Could not fully stop PID ${existingPid}; startup may still fail if lock remains.`,
        );
      }
    }
  }

  log.message(
    `Starting Next dev with METADATA_BACKEND=${metadataBackend}, CONTENT_FETCH_MODE=${contentFetchMode}`,
  );

  const localeWatcher = startLocaleWatcher();

  nextExitCode = await runCommand('npx', ['next', 'dev', ...nextArgs], backendEnv);

  localeWatcher.close();
  process.exit(nextExitCode);
}

main().catch((err) => {
  log.error('Error in dev runner:', err);
  process.exit(1);
});
