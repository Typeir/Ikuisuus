/**
 * @fileoverview Corrections Read API - Fetches raw MDX from the content repo via GitHub API
 * @description Server-side proxy that reads file content and SHA from the content repository
 * on GitHub. Used by the Corrections editor to load the current version of an MDX page
 * without relying on the local filesystem (serverless-safe).
 *
 * @module app/api/corrections/read/route
 * @version 1.0.0
 * @author Typeir
 * @since 2.0.0
 *
 * @requires next/server
 *
 * @example
 * ```typescript
 * // Client usage
 * const res = await fetch('/api/corrections/read?path=en/monsters/aboleth.sheet.mdx');
 * const { content, sha, path } = await res.json();
 * ```
 */

import { logger } from '@/lib/logging/logger';
import { draftRepository } from '@/lib/db/content/repositories/draftRepository';
import { NextRequest, NextResponse } from 'next/server';

const log = logger.child({ module: 'API:Corrections:Read' });

/** File path variants to try when resolving a slug to a content file. */
const PATH_VARIANTS = ['.mdx', '.sheet.mdx', '.md'] as const;

/**
 * Fetches a single file from the content repo via the GitHub Contents API.
 *
 * @param {string} filePath - Path relative to the content repo root (e.g. `en/monsters/aboleth.sheet.mdx`)
 * @returns {Promise<{ content: string; sha: string; path: string } | null>} File data or null if not found
 */
const fetchFileFromGitHub = async (
  filePath: string,
): Promise<{ content: string; sha: string; path: string } | null> => {
  const owner = process.env.CONTENT_REPO_OWNER;
  const repo = process.env.CONTENT_REPO_NAME;
  const token = process.env.GITHUB_PAT;

  if (!owner || !repo || !token) {
    throw new Error(
      'Missing GitHub configuration (CONTENT_REPO_OWNER, CONTENT_REPO_NAME, GITHUB_PAT)',
    );
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURI(filePath)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
    cache: 'no-store',
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${body}`);
  }

  const data = await res.json();

  if (data.type !== 'file' || !data.content) {
    return null;
  }

  return {
    content: Buffer.from(data.content, 'base64').toString('utf-8'),
    sha: data.sha,
    path: data.path,
  };
};

/**
 * GET /api/corrections/read
 *
 * Resolves a content slug to a file in the content repo and returns its raw
 * MDX content plus the current blob SHA (needed for concurrency checks on submit).
 *
 * Query params:
 *   - `slug` (required): Content slug, e.g. `monsters/aboleth`
 *   - `locale` (optional, default `en`): Content locale prefix
 *
 * @param {NextRequest} req - Incoming request
 * @returns {NextResponse} JSON `{ content, sha, path }` or error
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  const locale = searchParams.get('locale') || 'en';

  if (!slug) {
    return NextResponse.json(
      { error: 'Missing required query parameter: slug' },
      { status: 400 },
    );
  }

  const basePath = `${locale}/${slug}`;

  try {
    for (const ext of PATH_VARIANTS) {
      const candidate = `${basePath}${ext}`;
      const result = await fetchFileFromGitHub(candidate);
      if (result) {
        const activeDraft = await draftRepository.findActive(locale, slug);
        return NextResponse.json({
          ...result,
          draftCursor: {
            updatedAt: activeDraft?.updatedAt ?? null,
            versionHash: activeDraft?.versionHash ?? null,
          },
        });
      }
    }

    /** Also try slug/main.mdx for category index pages */
    const mainResult = await fetchFileFromGitHub(`${basePath}/main.mdx`);
    if (mainResult) {
      const activeDraft = await draftRepository.findActive(locale, slug);
      return NextResponse.json({
        ...mainResult,
        draftCursor: {
          updatedAt: activeDraft?.updatedAt ?? null,
          versionHash: activeDraft?.versionHash ?? null,
        },
      });
    }

    return NextResponse.json(
      { error: 'Content file not found' },
      { status: 404 },
    );
  } catch (error) {
    log.error('Error reading content from GitHub', {
      error: error instanceof Error ? error.message : String(error),
      slug,
      locale,
    });
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 502 },
    );
  }
}
