/**
 * @fileoverview Shallow-clones the content repository into `src/content`.
 * Skips when `src/content/en` is populated and not on Vercel. On Vercel,
 * removes existing content before re-cloning.
 *
 * @module scripts/build/fetchContent
 * @version 1.1.0
 * @author Typeir
 * @since 2026-01-01
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

/**
 * Branch to clone: an explicit override, else the branch being deployed.
 * Undefined off Vercel, which clones the repository's default branch.
 */
const REQUESTED_BRANCH =
  process.env['CONTENT_REPO_BRANCH'] ?? process.env['VERCEL_GIT_COMMIT_REF'];

/** Absolute path to the content directory. */
const CONTENT_DIR = join(process.cwd(), 'src', 'content');

/**
 * Replaces the token in a URL before it reaches a log line.
 *
 * `execSync` puts the whole command in its error message, so an unredacted
 * failure would print the PAT into the build log.
 *
 * @param {string} text - Text that may embed the authenticated URL
 * @returns {string} Text with any credential replaced
 */
function redact(text: string): string {
  return text.replace(/https:\/\/[^@\s]+@/g, 'https://***@');
}

/**
 * Whether the content repository publishes a branch of this name.
 *
 * @param {string} branch - Branch name to look for
 * @returns {boolean} True when the remote has it
 */
function hasBranch(branch: string): boolean {
  try {
    const out = execSync(
      `git ls-remote --heads ${CONTENT_REPO_URL} ${branch}`,
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    );
    return out.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Branch the clone should take, and why.
 *
 * Content tracks the branch being deployed when it publishes one of the same
 * name, so a preview builds against its own content. A branch the content repo
 * does not have falls back to the default rather than failing the build.
 *
 * @returns {{ branch: string | null; reason: string }} Branch to clone, or null for the default
 */
function resolveBranch(): { branch: string | null; reason: string } {
  if (!REQUESTED_BRANCH) {
    return { branch: null, reason: 'no branch requested' };
  }
  if (!hasBranch(REQUESTED_BRANCH)) {
    return { branch: null, reason: 'content has no branch of that name' };
  }
  return { branch: REQUESTED_BRANCH, reason: 'matched the deploying branch' };
}

/** Absolute path to the locale root used as the population check. */
const CONTENT_EN_DIR = join(CONTENT_DIR, 'en');

/**
 * Returns `true` when `src/content/en` exists and is non-empty.
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
 * Returns `true` when `process.env.VERCEL` equals `'1'`.
 */
function isVercelEnvironment(): boolean {
  return process.env['VERCEL'] === '1';
}

/**
 * Entry point. Shallow-clones the content repository when content is absent
 * or on Vercel. Exits with code 1 on clone failure.
 */
function main(): void {
  if (isContentPopulated() && !isVercelEnvironment()) {
    log.message('✅ Content already present — skipping clone', {
      path: CONTENT_EN_DIR,
    });
    process.exit(0);
  }

  if (isVercelEnvironment() && isContentPopulated()) {
    log.message(
      '♻️  Vercel detected — removing cached content to fetch latest',
      { path: CONTENT_DIR },
    );
  } else {
    log.message('📥 Content missing — cloning content repo...', {
      repo: `${CONTENT_REPO_OWNER}/${CONTENT_REPO_NAME}`,
      auth: GITHUB_PAT ? 'PAT' : 'public',
    });
  }

  if (existsSync(CONTENT_DIR)) {
    log.message('🗑  Removing stale content directory before clone');
    rmSync(CONTENT_DIR, { recursive: true, force: true });
  }

  const { branch, reason } = resolveBranch();
  const target = branch ? ` --branch ${branch}` : '';

  log.message('🌿 Content branch resolved', {
    requested: REQUESTED_BRANCH ?? '(none)',
    cloning: branch ?? '(default branch)',
    reason,
  });

  try {
    execSync(
      `git clone --depth=1${target} ${CONTENT_REPO_URL} ${CONTENT_DIR}`,
      { stdio: 'inherit' },
    );
    log.message('✅ Content repo cloned successfully', {
      branch: branch ?? '(default branch)',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    log.error('✖ Failed to clone content repo', { error: redact(message) });
    process.exit(1);
  }
}

main();
