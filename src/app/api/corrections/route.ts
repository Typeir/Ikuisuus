/**
 * @fileoverview Corrections submission API route.
 * @module app/api/corrections/route
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { writeAuditLog } from '@/lib/db/auditLog';
import { logger } from '@/lib/logging/logger';
import { isIpBanned } from '@/lib/security/bannedIps';
import { getClientIp } from '@/lib/security/getClientIp';
import { authenticateWithSession } from '@/modules/mdx-editor/application/use-cases/authenticateEditor';
import { submitCorrection } from '@/modules/mdx-editor/application/use-cases/submitCorrection';
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

const log = logger.child({ module: 'API:Corrections' });
const MAX_BODY_BYTES = 256 * 1024;

/**
 * Corrections payload sent by editor client.
 *
 * @interface CorrectionPayload
 * @property {string} path - Target content file path.
 * @property {string} content - Updated content body.
 * @property {string} baseSha - Base SHA for optimistic concurrency.
 * @property {boolean} [isNew] - Whether this operation creates a new file.
 * @property {string} [message] - Optional commit message.
 * @property {string | null} [expectedDraftUpdatedAt] - Draft cursor timestamp.
 * @property {string | null} [expectedDraftVersionHash] - Draft cursor hash.
 * @property {boolean} [renameEnabled] - Whether file rename is enabled.
 * @property {string} [renameToPath] - Target path for renamed file.
 */
interface CorrectionPayload {
  path: string;
  content: string;
  baseSha: string;
  isNew?: boolean;
  message?: string;
  expectedDraftUpdatedAt?: string | null;
  expectedDraftVersionHash?: string | null;
  renameEnabled?: boolean;
  renameToPath?: string;
}

/**
 * Parses and validates correction payload.
 *
 * @param {NextRequest} req - Incoming request.
 * @returns {Promise<{ ok: true; payload: CorrectionPayload } | { ok: false; response: NextResponse }>} Validation result.
 */
async function validatePayload(req: NextRequest) {
  const contentLength = parseInt(req.headers.get('content-length') || '0', 10);
  if (contentLength > MAX_BODY_BYTES) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: 'Payload too large' },
        { status: 413 },
      ),
    };
  }

  let body: CorrectionPayload;
  try {
    body = await req.json();
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 },
      ),
    };
  }

  if (!body.path || typeof body.path !== 'string') {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: 'Missing or invalid: path' },
        { status: 400 },
      ),
    };
  }

  if (!body.content || typeof body.content !== 'string') {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: 'Missing or invalid: content' },
        { status: 400 },
      ),
    };
  }

  if (!body.isNew && (!body.baseSha || typeof body.baseSha !== 'string')) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: 'Missing or invalid: baseSha' },
        { status: 400 },
      ),
    };
  }

  if (
    body.expectedDraftUpdatedAt !== undefined &&
    body.expectedDraftUpdatedAt !== null &&
    typeof body.expectedDraftUpdatedAt !== 'string'
  ) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: 'Missing or invalid: expectedDraftUpdatedAt' },
        { status: 400 },
      ),
    };
  }

  if (
    body.expectedDraftVersionHash !== undefined &&
    body.expectedDraftVersionHash !== null &&
    typeof body.expectedDraftVersionHash !== 'string'
  ) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: 'Missing or invalid: expectedDraftVersionHash' },
        { status: 400 },
      ),
    };
  }

  if (body.path.includes('..') || body.path.startsWith('/')) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Invalid path' }, { status: 400 }),
    };
  }

  if (
    body.renameEnabled &&
    (!body.renameToPath || typeof body.renameToPath !== 'string')
  ) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: 'Missing or invalid: renameToPath' },
        { status: 400 },
      ),
    };
  }

  return { ok: true as const, payload: body };
}

/**
 * Handles correction submission by authenticated users.
 *
 * @param {NextRequest} req - Incoming request.
 * @returns {Promise<NextResponse>} Submission response.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
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
  const { banned } = await isIpBanned(clientIp);
  if (banned) {
    return NextResponse.json(
      { error: 'Your network has been blocked due to a policy violation.' },
      { status: 403 },
    );
  }

  const auth = await authenticateWithSession(req);
  if (!auth.ok) {
    return auth.errorResponse as NextResponse;
  }

  const validated = await validatePayload(req);
  if (!validated.ok) {
    return validated.response;
  }

  try {
    const result = await submitCorrection({
      owner,
      repo,
      filePath: validated.payload.path,
      content: validated.payload.content,
      baseSha: validated.payload.baseSha,
      isNew: Boolean(validated.payload.isNew),
      message: validated.payload.message,
      auditId: auth.auditId as string,
      role: auth.role as 'admin' | 'editor',
      clientIp,
      expectedDraftUpdatedAt: validated.payload.expectedDraftUpdatedAt,
      expectedDraftVersionHash: validated.payload.expectedDraftVersionHash,
      renameEnabled: validated.payload.renameEnabled,
      renameToPath: validated.payload.renameToPath,
    });

    try {
      revalidatePath(`/library/${result.slugFromPath}`);
      if (result.oldSlugFromPath) {
        revalidatePath(`/library/${result.oldSlugFromPath}`);
      }
    } catch {
      log.debug('ISR revalidation failed (non-blocking)', {
        slug: result.slugFromPath,
        oldSlug: result.oldSlugFromPath,
      });
    }

    return NextResponse.json({ prUrl: result.prUrl }, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error & { code?: string };

    if (err.code === 'CONFLICT' || err.code === 'STALE_DRAFT') {
      await writeAuditLog({
        content_path: validated.payload.path,
        base_sha: validated.payload.baseSha,
        status: 'conflict',
        token_id: auth.auditId as string,
      });
      return NextResponse.json(
        {
          error:
            err.code === 'STALE_DRAFT'
              ? 'A newer edit for this page was already submitted. Reload the editor before submitting again.'
              : 'The file has been modified since you loaded it. Refresh and try again.',
        },
        { status: 409 },
      );
    }

    await writeAuditLog({
      content_path: validated.payload.path,
      base_sha: validated.payload.baseSha,
      status: 'error',
      token_id: auth.auditId as string,
    });

    return NextResponse.json(
      { error: 'Failed to create correction' },
      { status: 500 },
    );
  }
}
