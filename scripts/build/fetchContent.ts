/**
 * @fileoverview Ensures the content submodule is populated before build.
 *
 * Vercel strips the `.git` directory before running build commands, which
 * means `git submodule update` is unavailable. This script instead performs
 * a direct shallow clone of the content repository when `src/content/en` is
 * missing or empty. It is a no-op in local development where the submodule is
 * already checked out.
 *
 * @module build/fetchContent
 */

import { createLogger } from '@/lib/logging/logger';
import { execSync } from 'child_process';
import { existsSync, readdirSync, rmSync } from 'fs';
import { join } from 'path';

const log = createLogger({ script: 'fetchContent' });

const CONTENT_REPO_OWNER = process.env['CONTENT_REPO_OWNER'] ?? 'Typeir';
const CONTENT_REPO_NAME =
  process.env['CONTENT_REPO_NAME'] ?? 'ikuisuus-content';
const GITHUB_PAT = process.env['GITHUB_PAT'];

/** Authenticated (or public) HTTPS URL for the content repository. */
const CONTENT_REPO_URL = GITHUB_PAT
  ? `https://${GITHUB_PAT}@github.com/${CONTENT_REPO_OWNER}/${CONTENT_REPO_NAME}.git`
  : `https://github.com/${CONTENT_REPO_OWNER}/${CONTENT_REPO_NAME}.git`;

/** Absolute path to the content directory. */
const CONTENT_DIR = join(process.cwd(), 'src', 'content');

/** Absolute path to the locale root used as the population check. */
const CONTENT_EN_DIR = join(CONTENT_DIR, 'en');

/**
 * Returns `true` when the content directory appears to be populated with at
 * least one file under `src/content/en`.
 */
function isContentPopulated(): boolean {
  if (!existsSync(CONTENT_EN_DIR)) return false;
  try {
    return readdirSync(CONTENT_EN_DIR).length > 0;
  } catch {
    return false;
  }
}

/**
 * Entry point. Clones the content repository shallowly when content is absent.
 * Exits with a non-zero code on clone failure so the build fails visibly.
 */
function main(): void {
  if (isContentPopulated()) {
    log.message('✅ Content already present — skipping clone', {
      path: CONTENT_EN_DIR,
    });
    process.exit(0);
  }

  log.message('📥 Content missing — cloning content repo...', {
    repo: `${CONTENT_REPO_OWNER}/${CONTENT_REPO_NAME}`,
    auth: GITHUB_PAT ? 'PAT' : 'public',
  });

  if (existsSync(CONTENT_DIR)) {
    log.message('🗑  Removing stale content directory before clone');
    rmSync(CONTENT_DIR, { recursive: true, force: true });
  }

  try {
    execSync(`git clone --depth=1 ${CONTENT_REPO_URL} ${CONTENT_DIR}`, {
      stdio: 'inherit',
    });
    log.message('✅ Content repo cloned successfully');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    log.error('✖ Failed to clone content repo', { error: message });
    process.exit(1);
  }
}

main();
