/**
 * @fileoverview Auth Login API Route
 * @description Authenticates a user by username + password, returns a
 * non-expiring session token. Validates input with Zod.
 *
 * POST /api/auth/login
 *
 * @module app/api/auth/login/route
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { login, LoginRequestSchema } from '@/lib/db/auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/login
 *
 * @param {NextRequest} req - Request with JSON body `{ username, password }`
 * @returns {NextResponse} `{ token, user }` on success, `{ error }` on failure
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = LoginRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  const result = await login(parsed.data);

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  return NextResponse.json(result);
}
