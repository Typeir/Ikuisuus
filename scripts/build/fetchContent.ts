/**
 * @fileoverview Shallow-clones the content repository into `src/content`.
 * Skips when `src/content/en` is populated and not on Vercel. On Vercel,
 * removes existing content before re-cloning.
 *
 * @module build/fetchContent
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

/** Absolute path to the content directory. */
const CONTENT_DIR = join(process.cwd(), 'src', 'content');

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
