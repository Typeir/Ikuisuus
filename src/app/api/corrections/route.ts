/**
 * @fileoverview Corrections Submit API - Creates branches, commits, and PRs in the content repo
 * @description Server-side route that receives edited MDX content, validates an HMAC
 * capability token, verifies concurrency via baseSha, then creates a branch + commit + PR
 * in the content repository through the GitHub API. Logs every attempt to the audit table.
 *
 * @module app/api/corrections/route
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { writeAuditLog } from '@/lib/db/auditLog';
import { extractSession } from '@/lib/db/auth';
import { draftRepository } from '@/lib/db/content/repositories/draftRepository';
import { logger } from '@/lib/logging/logger';
import { isIpBanned } from '@/lib/security/bannedIps';
import { getClientIp } from '@/lib/security/getClientIp';
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import {
    buildBranchName,
    buildCommitMessage,
    buildPrContent,
    commitFile,
    createBranch,
    openPullRequest,
} from './corrections.service';

const log = logger.child({ module: 'API:Corrections' });

/** Maximum accepted request body size in bytes (256 KB). */
const MAX_BODY_BYTES = 256 * 1024;

/**
 * @typedef {Object} CorrectionPayload
 * @property {string} path - Content file path
 * @property {string} content - MDX content body
 * @property {string} baseSha - SHA of the file being replaced
 * @property {boolean} [isNew] - Whether this is a new file creation
 * @property {string} [message] - Optional custom commit message
 */
interface CorrectionPayload {
  path: string;
  content: string;
  baseSha: string;
  isNew?: boolean;
  message?: string;
  expectedDraftUpdatedAt?: string | null;
  expectedDraftVersionHash?: string | null;
}

export async function POST(req: NextRequest) {
  const secret = process.env.CORRECTIONS_SECRET;
  const owner = process.env.CONTENT_REPO_OWNER;
  const repo = process.env.CONTENT_REPO_NAME;

  if (!secret || !owner || !repo || !process.env.GITHUB_PAT) {
    return NextResponse.json(
      { error: 'Corrections module is not configured' },
      { status: 503 },
    );
  }

  const clientIp = getClientIp(req);

  const { banned, entry: banEntry } = await isIpBanned(clientIp);
  if (banned) {
    log.message('Blocked request from banned IP range', {
      level: 'warn',
      ip: clientIp,
      range: banEntry?.range,
      bannedAt: banEntry?.bannedAt,
      reason: banEntry?.reason,
    });
    return NextResponse.json(
      { error: 'Your network has been blocked due to a policy violation.' },
      { status: 403 },
    );
  }

  const authHeader = req.headers.get('authorization');
  const session = await extractSession(authHeader);
  if (!session) {
    log.message('Missing or invalid session', {
      level: 'warn',
      reason: 'invalid_session',
      url: req.url,
    });

    return NextResponse.json(
      { error: 'Missing or invalid authorization' },
      { status: 401 },
    );
  }

  const auditId = session.username;

  const contentLength = parseInt(req.headers.get('content-length') || '0', 10);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  let body: CorrectionPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { path: filePath, content, baseSha, isNew, message } = body;

  const expectedDraftUpdatedAt = body.expectedDraftUpdatedAt;
  const expectedDraftVersionHash = body.expectedDraftVersionHash;

  if (!filePath || typeof filePath !== 'string') {
    log.message('Missing or invalid payload field: path', {
      level: 'warn',
      fieldType: typeof filePath,
      auditId,
    });
    return NextResponse.json(
      { error: 'Missing or invalid: path' },
      { status: 400 },
    );
  }

  if (!content || typeof content !== 'string') {
    log.message('Missing or invalid payload field: content', {
      level: 'warn',
      filePath,
      contentType: typeof content,
      auditId,
    });
    return NextResponse.json(
      { error: 'Missing or invalid: content' },
      { status: 400 },
    );
  }

  if (!isNew && (!baseSha || typeof baseSha !== 'string')) {
    log.message('Missing or invalid payload field: baseSha', {
      level: 'warn',
      filePath,
      isNew: Boolean(isNew),
      baseShaType: typeof baseSha,
      auditId,
    });

    await writeAuditLog({
      content_path: filePath,
      base_sha: baseSha as unknown as string,
      status: 'error',
      token_id: auditId,
    });

    return NextResponse.json(
      { error: 'Missing or invalid: baseSha' },
      { status: 400 },
    );
  }

  if (
    expectedDraftUpdatedAt !== undefined &&
    expectedDraftUpdatedAt !== null &&
    typeof expectedDraftUpdatedAt !== 'string'
  ) {
    return NextResponse.json(
      { error: 'Missing or invalid: expectedDraftUpdatedAt' },
      { status: 400 },
    );
  }

  if (
    expectedDraftVersionHash !== undefined &&
    expectedDraftVersionHash !== null &&
    typeof expectedDraftVersionHash !== 'string'
  ) {
    return NextResponse.json(
      { error: 'Missing or invalid: expectedDraftVersionHash' },
      { status: 400 },
    );
  }

  /** Reject paths that attempt directory traversal */
  if (filePath.includes('..') || filePath.startsWith('/')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const branchName = buildBranchName(filePath, !!isNew);
  const commitMsg = buildCommitMessage(filePath, !!isNew, message);
  const { title: prTitle, body: prBody } = buildPrContent(
    filePath,
    !!isNew,
    baseSha,
    auditId,
    clientIp,
  );

  const locale = filePath.match(/^([a-z]{2})\//)?.[1] ?? 'en';
  const slugFromPath = filePath
    .replace(/^[a-z]{2}\//, '')
    .replace(/\.(sheet\.)?mdx$/, '');
  const draftStatus = session.role === 'admin' ? 'active' : 'pending';

  try {
    await draftRepository.upsertIfUnchanged(
      {
        locale,
        slug: slugFromPath,
        content,
        status: draftStatus,
      },
      {
        updatedAt:
          expectedDraftUpdatedAt === undefined
            ? undefined
            : expectedDraftUpdatedAt,
        versionHash:
          expectedDraftVersionHash === undefined
            ? undefined
            : expectedDraftVersionHash,
      },
    );

    await createBranch(owner, repo, branchName);
    await commitFile(
      owner,
      repo,
      filePath,
      content,
      isNew ? '' : baseSha,
      branchName,
      commitMsg,
    );
    const prUrl = await openPullRequest(
      owner,
      repo,
      branchName,
      prTitle,
      prBody,
    );

    await writeAuditLog({
      content_path: filePath,
      base_sha: baseSha,
      pr_url: prUrl,
      status: 'submitted',
      token_id: auditId,
    });

    log.message('Correction PR created', { prUrl, filePath, auditId });

    /** Trigger ISR revalidation for the affected content page. */
    try {
      revalidatePath(`/library/${slugFromPath}`);
      log.debug('ISR revalidation triggered', { slug: slugFromPath });
    } catch (revalidateError) {
      log.debug('ISR revalidation failed (non-blocking)', {
        error:
          revalidateError instanceof Error
            ? revalidateError.message
            : String(revalidateError),
      });
    }

    return NextResponse.json({ prUrl }, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error & { code?: string };

    if (err.code === 'CONFLICT') {
      await writeAuditLog({
        content_path: filePath,
        base_sha: baseSha,
        status: 'conflict',
        token_id: auditId,
      });
      return NextResponse.json(
        {
          error:
            'The file has been modified since you loaded it. Refresh and try again.',
        },
        { status: 409 },
      );
    }

    if (err.code === 'STALE_DRAFT') {
      await writeAuditLog({
        content_path: filePath,
        base_sha: baseSha,
        status: 'conflict',
        token_id: auditId,
      });
      return NextResponse.json(
        {
          error:
            'A newer edit for this page was already submitted. Reload the editor before submitting again.',
        },
        { status: 409 },
      );
    }

    log.error('Correction submission failed', {
      error: err.message,
      stack: err.stack,
      code: (err as any).code,
      filePath,
      owner,
      repo,
      auditId,
    });

    log.debug('Full error object', { err });

    await writeAuditLog({
      content_path: filePath,
      base_sha: baseSha,
      status: 'error',
      token_id: auditId,
    });

    return NextResponse.json(
      { error: 'Failed to create correction' },
      { status: 500 },
    );
  }
}
