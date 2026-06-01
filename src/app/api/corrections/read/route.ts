/**
 * @fileoverview Corrections read API route.
 * @module app/api/corrections/read/route
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { draftRepository } from '@/lib/db/content/repositories/draftRepository';
import { logger } from '@/lib/logging/logger';
import { NextRequest, NextResponse } from 'next/server';

const log = logger.child({ module: 'API:Corrections:Read' });

const PATH_VARIANTS = [
  '.mdx',
  '.sheet.mdx',
  '.heirloom.mdx',
  '.trinket.mdx',
  '.md',
] as const;

/**
 * Loads one repository file payload from GitHub contents API.
 *
 * @param {string} filePath - Relative file path in repository.
 * @returns {Promise<{ content: string; sha: string; path: string } | null>} Decoded file payload.
 */
async function fetchFileFromGitHub(
  filePath: string,
): Promise<{ content: string; sha: string; path: string } | null> {
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
    throw new Error(`GitHub API error ${res.status}: ${await res.text()}`);
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
}

/**
 * Reads content file by slug/locale and returns content with draft cursor.
 *
 * @param {NextRequest} req - Incoming request.
 * @returns {Promise<NextResponse>} File payload or error.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
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
