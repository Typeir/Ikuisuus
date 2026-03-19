#!/usr/bin/env tsx
/**
 * Runs local dev with explicit metadata backend controls.
 *
 * Behavior:
 * - Default backend: fs
 * - `--pg`: force pg backend
 * - `--fs`: force fs backend
 * - `--no-preinit`: skip pre-init pipeline
 * - `--no-replace`: do not auto-stop an existing same-project Next dev process
 * - Any other args are passed through to `next dev`
 */
import { spawn } from 'child_process';
import { readFile, stat } from 'fs/promises';
import path from 'path';

/**
 * Runs a command and resolves with its exit code.
 *
 * @param command Executable name.
 * @param args Argument list.
 * @param env Optional env overrides.
 * @returns Process exit code.
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
 * @param filePath File path to check.
 * @returns True if the file exists.
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
 * @param ms Delay in milliseconds.
 * @returns Promise resolved after the delay.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Returns whether a process ID is currently alive.
 *
 * @param pid Process ID to probe.
 * @returns True when the process exists.
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
 * @param projectRoot Project root directory.
 * @returns Existing Next dev PID or null.
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
 * @param pid Process ID to stop.
 * @param graceMs Grace period before force kill.
 * @returns True if a process was targeted and is no longer alive.
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
    console.error('Use either --pg or --fs, not both.');
    process.exit(1);
  }

  const metadataBackend = usePg ? 'pg' : 'fs';

  if (!skipPreInit) {
    console.log('Running pre-init...');
    const code = await runCommand('npm', ['run', 'pre-init']);
    if (code !== 0) {
      console.error('pre-init failed with exit code', code);
      process.exit(code);
    }
  } else {
    console.log('Skipping pre-init (passed --no-preinit)');
  }

  let nextExitCode: number;

  if (!disableReplace) {
    const existingPid = await readNextDevLockPid(process.cwd());
    if (existingPid && existingPid !== process.pid && isPidAlive(existingPid)) {
      console.log(`Stopping existing Next dev process PID ${existingPid}...`);
      const stopped = await stopProcessGracefully(existingPid);
      if (!stopped) {
        console.warn(
          `Could not fully stop PID ${existingPid}; startup may still fail if lock remains.`,
        );
      }
    }
  }

  console.log(`Starting Next dev with METADATA_BACKEND=${metadataBackend}`);
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    METADATA_BACKEND: metadataBackend,
  };

  nextExitCode = await runCommand(
    'npx',
    ['next', 'dev', ...nextArgs],
    env,
  );

  process.exit(nextExitCode);
}

main().catch((err) => {
  console.error('Error in dev runner:', err);
  process.exit(1);
});
