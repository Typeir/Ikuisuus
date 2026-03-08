/**
 * @fileoverview Corrections Submit API - Creates branches, commits, and PRs in the content repo
 * @description Server-side route that receives edited MDX content, validates an HMAC
 * capability token, verifies concurrency via baseSha, then creates a branch + commit + PR
 * in the content repository through the GitHub API. Logs every attempt to the audit table.
 *
 * @module app/api/corrections/route
 */

import { writeAuditLog } from '@/lib/db/auditLog';
import { extractSession } from '@/lib/db/auth';
import { logger } from '@/lib/logging/logger';
import { banIp, isIpBanned } from '@/lib/security/bannedIps';
import { checkProfanityMultiple } from '@/lib/security/profanityFilter';
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

const log = logger.child({ module: 'API:Corrections' });

/** Maximum accepted request body size in bytes (256 KB). */
const MAX_BODY_BYTES = 256 * 1024;

interface CorrectionPayload {
  path: string;
  content: string;
  baseSha: string;
  isNew?: boolean;
  message?: string;
}

const ghFetch = async (
  endpoint: string,
  init?: RequestInit,
): Promise<Response> => {
  const token = process.env.GITHUB_PAT;
  return fetch(`https://api.github.com/${endpoint}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
};

const createBranch = async (
  owner: string,
  repo: string,
  branchName: string,
): Promise<void> => {
  const refRes = await ghFetch(`repos/${owner}/${repo}/git/ref/heads/main`);
  if (!refRes.ok) {
    throw new Error(`Failed to get main ref: ${await refRes.text()}`);
  }
  const refData = await refRes.json();
  const mainSha = refData.object.sha;

  const createRes = await ghFetch(`repos/${owner}/${repo}/git/refs`, {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: mainSha }),
  });

  if (!createRes.ok) {
    const body = await createRes.text();
    throw new Error(`Failed to create branch: ${body}`);
  }
};

const commitFile = async (
  owner: string,
  repo: string,
  filePath: string,
  content: string,
  baseSha: string,
  branch: string,
  message: string,
): Promise<void> => {
  const payload: Record<string, string> = {
    message,
    content: Buffer.from(content).toString('base64'),
    branch,
  };
  if (baseSha) payload.sha = baseSha;

  const res = await ghFetch(
    `repos/${owner}/${repo}/contents/${encodeURI(filePath)}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
  );

  if (res.status === 409) {
    throw Object.assign(
      new Error('Conflict: file has been modified since you loaded it'),
      {
        code: 'CONFLICT',
      },
    );
  }

  if (!res.ok) {
    throw new Error(`Failed to commit file: ${await res.text()}`);
  }
};

const openPullRequest = async (
  owner: string,
  repo: string,
  branch: string,
  title: string,
  body: string,
): Promise<string> => {
  const res = await ghFetch(`repos/${owner}/${repo}/pulls`, {
    method: 'POST',
    body: JSON.stringify({ title, body, head: branch, base: 'main' }),
  });

  if (!res.ok) {
    throw new Error(`Failed to open PR: ${await res.text()}`);
  }

  const data = await res.json();
  return data.html_url as string;
};

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

  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

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

  // Build a full headers object for verbose logging
  const headersObjAll: Record<string, string> = {};
  req.headers.forEach((v, k) => {
    headersObjAll[k] = v;
  });

  if (!filePath || typeof filePath !== 'string') {
    log.message('Missing or invalid payload field: path', {
      level: 'warn',
      filePath: String(filePath),
      fieldType: typeof filePath,
      headers: headersObjAll,
      bodyFull: JSON.stringify(body),
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
      contentLength: content ? content.length : 0,
      contentFull: content,
      headers: headersObjAll,
      bodyFull: JSON.stringify(body),
      auditId,
    });
    return NextResponse.json(
      { error: 'Missing or invalid: content' },
      { status: 400 },
    );
  }

  if (!isNew && (!baseSha || typeof baseSha !== 'string')) {
    // Verbose logging — include everything unmasked for debugging
    const authHeaderFull =
      headersObjAll['authorization'] ?? headersObjAll['Authorization'] ?? null;

    log.message('Missing or invalid payload field: baseSha', {
      level: 'warn',
      filePath,
      isNew: Boolean(isNew),
      baseShaRaw:
        baseSha === undefined
          ? 'undefined'
          : baseSha === null
            ? 'null'
            : String(baseSha),
      baseShaType: typeof baseSha,
      authHeader: authHeaderFull,
      headers: headersObjAll,
      contentFull: content,
      contentLength: content ? content.length : 0,
      contentLengthHeader: req.headers.get('content-length'),
      bodyFull: JSON.stringify(body),
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

  /** Reject paths that attempt directory traversal */
  if (filePath.includes('..') || filePath.startsWith('/')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const profanityResult = checkProfanityMultiple([
    content,
    filePath,
    message ?? '',
  ]);

  if (profanityResult.flagged) {
    log.message('Profanity detected — banning IP range', {
      level: 'warn',
      ip: clientIp,
      terms: profanityResult.matches,
      filePath,
      auditId,
    });

    await banIp(
      clientIp,
      `Profanity in correction submission (terms: ${profanityResult.matches.join(', ')})`,
    );

    await writeAuditLog({
      content_path: filePath,
      base_sha: baseSha ?? '',
      status: 'error',
      token_id: auditId,
    });

    return NextResponse.json(
      {
        error:
          'Submission rejected: prohibited content detected. Your network has been blocked.',
      },
      { status: 403 },
    );
  }

  const timestamp = Date.now();
  const actionLabel = isNew ? 'new' : 'corrections';
  const branchName = `${actionLabel}/${filePath.replace(/[^a-zA-Z0-9\-_/]/g, '-')}-${timestamp}`;
  const commitMsg =
    message ||
    (isNew ? `[new]: create ${filePath}` : `[correction]: update ${filePath}`);
  const prTitle = isNew ? `New file: ${filePath}` : `Correction: ${filePath}`;
  const prBody = isNew
    ? `New file submitted via the Library editor.\n\n**File**: \`${filePath}\`\n**Token label**: \`${auditId}\``
    : `Automated correction submitted via the Library editor.\n\n**File**: \`${filePath}\`\n**Based on SHA**: \`${baseSha}\`\n**Token label**: \`${auditId}\``;

  try {
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

    /** Trigger ISR revalidation for the affected content page */
    try {
      const slugFromPath = filePath
        .replace(/^[a-z]{2}\//, '')
        .replace(/\.(sheet\.)?mdx$/, '');
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
