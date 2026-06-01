/**
 * @fileoverview Shared editor authentication helpers for mdx-editor routes.
 * @module modules/mdx-editor/application/use-cases/authenticateEditor
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { extractSession } from '@/lib/db/auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Secret-based route auth result.
 *
 * @interface SecretAuthResult
 * @property {boolean} ok - Whether authorization succeeded.
 * @property {NextResponse} [errorResponse] - Error response when unauthorized.
 */
export interface SecretAuthResult {
  ok: boolean;
  errorResponse?: NextResponse;
}

/**
 * Session-based route auth result.
 *
 * @interface SessionAuthResult
 * @property {boolean} ok - Whether authorization succeeded.
 * @property {string} [auditId] - Authenticated username for audit trails.
 * @property {'admin' | 'editor'} [role] - Authenticated role.
 * @property {NextResponse} [errorResponse] - Error response when unauthorized.
 */
export interface SessionAuthResult {
  ok: boolean;
  auditId?: string;
  role?: 'admin' | 'editor';
  errorResponse?: NextResponse;
}

/**
 * Validates x-revalidation-secret header.
 *
 * @param {NextRequest} req - Incoming request.
 * @returns {SecretAuthResult} Authorization result.
 */
export function authenticateWithSecret(req: NextRequest): SecretAuthResult {
  const secret = process.env.REVALIDATION_SECRET;
  if (!secret) {
    return {
      ok: false,
      errorResponse: NextResponse.json(
        { error: 'Draft API is not configured' },
        { status: 503 },
      ),
    };
  }

  const provided = req.headers.get('x-revalidation-secret');
  if (!provided || provided !== secret) {
    return {
      ok: false,
      errorResponse: NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 },
      ),
    };
  }

  return { ok: true };
}

/**
 * Validates Bearer session token via shared auth extractor.
 *
 * @param {NextRequest} req - Incoming request.
 * @returns {Promise<SessionAuthResult>} Authorization result.
 */
export async function authenticateWithSession(
  req: NextRequest,
): Promise<SessionAuthResult> {
  const authHeader = req.headers.get('authorization');
  const session = await extractSession(authHeader);

  if (!session) {
    return {
      ok: false,
      errorResponse: NextResponse.json(
        { error: 'Missing or invalid authorization' },
        { status: 401 },
      ),
    };
  }

  return {
    ok: true,
    auditId: session.username,
    role: session.role,
  };
}
