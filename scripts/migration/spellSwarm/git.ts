/**
 * @fileoverview Git operations for the spell swarm migration.
 *
 * Operates directly on the `src/content` git submodule (ikuisuus-content).
 * Each spell becomes one commit on `feat/spell-external-srd`; the branch is
 * pushed once per batch.
 *
 * @module scripts/migration/spellSwarm/git
 * @version 2.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

/** The single review branch all spell commits land on. */
export const SWARM_BRANCH = 'feat/spell-external-srd';

/** Root of the content submodule (ikuisuus-content). */
const SUBMODULE_DIR = path.resolve('src', 'content');

/**
 * Ensures `SWARM_BRANCH` is checked out inside the content submodule.
 *
 * Already on branch → pull latest. Branch exists locally → checkout.
 * Branch exists on remote → track it. Otherwise → create from HEAD.
 *
 * @returns {Promise<void>}
 */
export const initSwarmWorktree = async (): Promise<void> => {
  const current = await execAsync(
    `git -C "${SUBMODULE_DIR}" rev-parse --abbrev-ref HEAD`,
  )
    .then(({ stdout }) => stdout.trim())
    .catch(() => '');

  if (current === SWARM_BRANCH) {
    await execAsync(
      `git -C "${SUBMODULE_DIR}" pull --ff-only origin "${SWARM_BRANCH}"`,
    ).catch(() => undefined);
    return;
  }

  const localExists = await execAsync(
    `git -C "${SUBMODULE_DIR}" rev-parse --verify "${SWARM_BRANCH}"`,
  )
    .then(() => true)
    .catch(() => false);

  if (localExists) {
    await execAsync(`git -C "${SUBMODULE_DIR}" checkout "${SWARM_BRANCH}"`);
    return;
  }

  const { stdout } = await execAsync(
    `git -C "${SUBMODULE_DIR}" ls-remote --heads origin "${SWARM_BRANCH}"`,
  ).catch(() => ({ stdout: '' }));

  if (stdout.trim()) {
    await execAsync(
      `git -C "${SUBMODULE_DIR}" checkout -b "${SWARM_BRANCH}" --track "origin/${SWARM_BRANCH}"`,
    );
  } else {
    await execAsync(`git -C "${SUBMODULE_DIR}" checkout -b "${SWARM_BRANCH}"`);
  }
};

/**
 * Writes a spell MDX file into the content submodule and commits it.
 *
 * @param {string} absoluteFilePath - Absolute path to the spell file inside the submodule.
 * @param {string} content - Full MDX file content to write.
 * @returns {Promise<void>}
 */
export const commitSpellToWorktree = async (
  absoluteFilePath: string,
  content: string,
): Promise<void> => {
  const relPath = path
    .relative(SUBMODULE_DIR, absoluteFilePath)
    .replace(/\\/g, '/');

  await fs.mkdir(path.dirname(absoluteFilePath), { recursive: true });
  await fs.writeFile(absoluteFilePath, content, 'utf-8');
  await execAsync(`git -C "${SUBMODULE_DIR}" add "${relPath}"`);
  await execAsync(
    `git -C "${SUBMODULE_DIR}" commit --no-verify -m "[feat]: add ${path.basename(absoluteFilePath)} from SRD 5.1 (OGL)"`,
  );
};

/**
 * Pushes all pending commits on the swarm branch to the submodule's origin.
 * Called once at the end of each CRON batch.
 *
 * @returns {Promise<void>}
 */
export const pushSwarmBranch = async (): Promise<void> => {
  await execAsync(`git -C "${SUBMODULE_DIR}" push origin "${SWARM_BRANCH}"`);
};
