/**
 * @fileoverview Auth Validate API Route
 * @module app/api/auth/validate/route
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { extractSession } from '@/lib/db/auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Validates a session token and returns the session payload.
 *
 * GET /api/auth/validate
 *
 * Expects `Authorization: Bearer <session-token>` header.
 *
 * @param {NextRequest} req - Incoming request
 * @returns {NextResponse} `{ valid, session }` or `{ valid: false, error }`
 */
export async function GET(req: NextRequest) {
  const session = await extractSession(req.headers.get('authorization'));

  if (!session) {
    return NextResponse.json(
      { valid: false, error: 'Invalid or missing session token' },
      { status: 401 },
    );
  }

  return NextResponse.json({ valid: true, session });
}
