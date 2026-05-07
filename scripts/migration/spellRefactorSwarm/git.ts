/**
 * @fileoverview Git operations for the spell lore-refactor swarm.
 *
 * Operates on the `src/content` git submodule. Each refactored spell becomes
 * one commit on the current branch; the batch is pushed once per cron cycle.
 *
 * @module scripts/migration/spellRefactorSwarm/git
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

/** Branch that receives all refactor commits. */
export const REFACTOR_BRANCH = 'feat/spell-lore-refactor';

/** Root of the content submodule. */
const SUBMODULE_DIR = path.resolve('src', 'content');

/**
 * Ensures {@link REFACTOR_BRANCH} is checked out inside the content submodule.
 *
 * Already on branch → pull latest. Branch exists locally → checkout.
 * Branch exists on remote → track it. Otherwise → create from HEAD.
 *
 * @returns {Promise<void>}
 */
export const initRefactorBranch = async (): Promise<void> => {
  const current = await execAsync(
    `git -C "${SUBMODULE_DIR}" rev-parse --abbrev-ref HEAD`,
  )
    .then(({ stdout }) => stdout.trim())
    .catch(() => '');

  if (current === REFACTOR_BRANCH) {
    await execAsync(
      `git -C "${SUBMODULE_DIR}" pull --ff-only origin "${REFACTOR_BRANCH}"`,
    ).catch(() => undefined);
    return;
  }

  const localExists = await execAsync(
    `git -C "${SUBMODULE_DIR}" rev-parse --verify "${REFACTOR_BRANCH}"`,
  )
    .then(() => true)
    .catch(() => false);

  if (localExists) {
    await execAsync(`git -C "${SUBMODULE_DIR}" checkout "${REFACTOR_BRANCH}"`);
    return;
  }

  const { stdout } = await execAsync(
    `git -C "${SUBMODULE_DIR}" ls-remote --heads origin "${REFACTOR_BRANCH}"`,
  ).catch(() => ({ stdout: '' }));

  if (stdout.trim()) {
    await execAsync(
      `git -C "${SUBMODULE_DIR}" checkout -b "${REFACTOR_BRANCH}" --track "origin/${REFACTOR_BRANCH}"`,
    );
  } else {
    await execAsync(
      `git -C "${SUBMODULE_DIR}" checkout -b "${REFACTOR_BRANCH}"`,
    );
  }
};

/**
 * Stages a refactored spell file and commits it to the content submodule.
 * Verifies that the file has actual changes before committing to avoid duplicate commits.
 *
 * @param {string} absoluteFilePath - Absolute path to the spell file.
 * @returns {Promise<void>}
 */
export const commitRefactoredSpell = async (
  absoluteFilePath: string,
): Promise<void> => {
  const relPath = path
    .relative(SUBMODULE_DIR, absoluteFilePath)
    .replace(/\\/g, '/');

  await execAsync(`git -C "${SUBMODULE_DIR}" add "${relPath}"`);

  /** Verify there are staged changes before committing. */
  const { stdout: diffOutput } = await execAsync(
    `git -C "${SUBMODULE_DIR}" diff --cached --name-only`,
  );

  if (!diffOutput.trim().includes(relPath)) {
    /** No changes to commit — file was already in this state. */
    return;
  }

  await execAsync(
    `git -C "${SUBMODULE_DIR}" commit --no-verify -m "[refactor]: lore description for ${path.basename(absoluteFilePath)}"`,
  );
};

/**
 * Stages and commits multiple refactored spell files in a single transaction.
 * Groups all files into one commit with a batch message.
 *
 * @param {string[]} absoluteFilePaths - Absolute paths to the spell files.
 * @param {string} batchMessage - The commit message.
 * @returns {Promise<void>}
 */
export const commitBatch = async (
  absoluteFilePaths: string[],
  batchMessage: string,
): Promise<void> => {
  const relPaths = absoluteFilePaths.map((p) =>
    path.relative(SUBMODULE_DIR, p).replace(/\\/g, '/'),
  );

  for (const relPath of relPaths) {
    await execAsync(`git -C "${SUBMODULE_DIR}" add "${relPath}"`);
  }

  const { stdout: diffOutput } = await execAsync(
    `git -C "${SUBMODULE_DIR}" diff --cached --name-only`,
  );

  if (!diffOutput.trim()) {
    return;
  }

  await execAsync(
    `git -C "${SUBMODULE_DIR}" commit --no-verify -m "${batchMessage}"`,
  );
};

/**
 * Pushes all pending commits on the refactor branch to the submodule's origin.
 * Called once at the end of each batch.
 *
 * @returns {Promise<void>}
 */
export const pushRefactorBranch = async (): Promise<void> => {
  await execAsync(`git -C "${SUBMODULE_DIR}" push origin "${REFACTOR_BRANCH}"`);
};

/**
 * Returns all spell file paths that were added to the content submodule
 * since the given base commit hash.
 * Includes any untracked files in the spells directory as well.
 *
 * @param {string} baseCommit - The git commit hash to diff from.
 * @returns {Promise<string[]>} Absolute paths to added spell MDX files.
 */
export const getAddedSpellPaths = async (
  baseCommit: string,
): Promise<string[]> => {
  const spellsDir = path.join(SUBMODULE_DIR, 'en', 'spells');

  const { stdout: committedOut } = await execAsync(
    `git -C "${SUBMODULE_DIR}" diff --name-only --diff-filter=A ${baseCommit}..HEAD -- en/spells/`,
  ).catch(() => ({ stdout: '' }));

  const { stdout: untrackedOut } = await execAsync(
    `git -C "${SUBMODULE_DIR}" ls-files --others --exclude-standard -- en/spells/`,
  ).catch(() => ({ stdout: '' }));

  const allRelPaths = [...committedOut.split('\n'), ...untrackedOut.split('\n')]
    .map((l) => l.trim())
    .filter((l) => l.endsWith('.mdx'));

  return [...new Set(allRelPaths)].map((rel) => path.join(SUBMODULE_DIR, rel));
};
