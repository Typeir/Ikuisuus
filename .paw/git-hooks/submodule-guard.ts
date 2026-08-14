#!/usr/bin/env npx tsx --tsconfig tsconfig.scripts.json

/**
 * Submodule Staging Guard
 *
 * @fileoverview Blocks commits with staged files in the content
 * submodule (src/content). Skipped when IK_RUNNING=1.
 *
 * @module .github/PAW/git-hooks/submodule-guard
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

import { execSync } from 'child_process';

/**
 * Content submodule path (relative to repo root).
 */
const SUBMODULE_PATH = 'src/content';

/**
 * Lists staged files via git diff --cached --name-only.
 *
 * @returns {string[]} Array of relative staged file paths
 */
function getStagedFiles(): string[] {
  try {
    const output = execSync('git diff --cached --name-only', {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    return output.split('\n').filter(Boolean);
  } catch {
    console.error('❌ Error reading staged files');
    process.exit(1);
  }
}

/**
 * Exits with code 1 if any staged file is under the content submodule path.
 */
function runSubmoduleGuard(): void {
  if (process.env.IK_RUNNING === '1') {
    return;
  }

  const stagedFiles = getStagedFiles();
  const submodulePrefix = SUBMODULE_PATH.replace(/\\/g, '/');
  const violations = stagedFiles.filter(
    (f) => f.startsWith(submodulePrefix + '/') || f === submodulePrefix,
  );

  if (violations.length === 0) {
    return;
  }

  const fileList = violations.map((file) => `  📄 ${file}`).join('\n');
  console.error(
    '\n❌ SUBMODULE GUARD FAILED\n\n' +
      'You have staged changes inside the content submodule (' +
      SUBMODULE_PATH +
      ').\n' +
      'Commit them in the content repo instead.\n\n' +
      fileList,
  );
  process.exit(1);
}

runSubmoduleGuard();
