/**
 * @fileoverview GitHub PAT Scope Validator
 * @description Tests a GitHub Personal Access Token by fetching repository details
 * and checking OAuth scopes in the response headers.
 *
 * @module scripts/test-pat
 * @version 1.0.0
 */

import { createLogger } from '@/lib/logging/logger';
import { readFileSync } from 'fs';
import https from 'https';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const log = createLogger({ module: 'test-pat' });

const REPO_OWNER = 'Typeir';
const REPO_NAME = 'ikuisuus-content';

/**
 * Parses a .env-style file into a key-value record.
 *
 * @param filePath - Path to the env file
 * @returns Parsed environment variables or null on failure
 */
function parseEnvFile(filePath: string): Record<string, string> | null {
  try {
    const raw = readFileSync(filePath, 'utf8');
    const lines = raw.split(/\r?\n/);
    const env: Record<string, string> = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
    return env;
  } catch {
    return null;
  }
}

const envPath = resolve(__dirname, '..', '.env.local');
const envFromFile = parseEnvFile(envPath);
const GITHUB_PAT =
  process.env.GITHUB_PAT || (envFromFile && envFromFile.GITHUB_PAT) || null;

if (!GITHUB_PAT) {
  log.error('GITHUB_PAT not found in environment or .env.local');
  process.exit(1);
}

log.message('Using GITHUB_PAT from', {
  detail: process.env.GITHUB_PAT
    ? 'process.env'
    : envFromFile
      ? envPath
      : 'unknown',
});

const options: https.RequestOptions = {
  hostname: 'api.github.com',
  path: `/repos/${REPO_OWNER}/${REPO_NAME}`,
  method: 'GET',
  headers: {
    'User-Agent': 'ikuisuus-cli',
    Authorization: `Bearer ${GITHUB_PAT}`,
    Accept: 'application/vnd.github+json',
  },
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk: Buffer) => (body += chunk));
  res.on('end', () => {
    try {
      const parsed = JSON.parse(body);
      if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
        log.message('Repository details fetched successfully');
        log.message(`Name: ${parsed.full_name}`);
        log.message(`Private: ${parsed.private}`);
        log.message(`Default branch: ${parsed.default_branch}`);

        const scopesHeader = (res.headers['x-oauth-scopes'] as string) || '';
        const acceptedHeader =
          (res.headers['x-accepted-oauth-scopes'] as string) || '';
        log.message('PAT scopes header:', { detail: scopesHeader || '(none)' });
        if (acceptedHeader)
          log.message('Accepted scopes for endpoint:', {
            detail: acceptedHeader,
          });

        const scopes = scopesHeader
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        const needsRepoScope = parsed.private === true;
        const hasRepo = scopes.includes('repo');
        const hasPublicRepo = scopes.includes('public_repo');

        if (needsRepoScope) {
          if (!hasRepo) {
            log.error(
              'This repository is private but the token does not include the `repo` scope. Regenerate the PAT with the `repo` scope (or use a token with org SSO approved access).',
            );
            process.exit(2);
          }
        } else {
          if (!hasRepo && !hasPublicRepo) {
            log.error(
              'Repository is public but the token lacks `repo` or `public_repo` scope. Regenerate the PAT with `public_repo`, or `repo` for full access.',
            );
            process.exit(2);
          }
        }

        log.message(
          '\nPAT scope check passed — token has the necessary scopes.',
        );
      } else {
        log.error(`Error: ${res.statusCode} ${res.statusMessage}`, {
          detail: parsed,
        });
        process.exit(1);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      log.error('Failed to parse response', {
        detail: message,
        rawBody: body,
      });
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  log.error('Request failed', { detail: e.message });
  process.exit(1);
});

req.end();
