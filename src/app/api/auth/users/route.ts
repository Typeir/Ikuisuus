/**
 * @fileoverview Auth Users API Route
 * @description Admin-only endpoints for user management (list, create, delete).
 *
 * GET  /api/auth/users — List all users (admin only)
 * POST /api/auth/users — Create a new user (admin only)
 *
 * @module app/api/auth/users/route
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import {
    CreateUserRequestSchema,
    createUser,
    extractSession,
    getUserAdapter,
} from '@/lib/db/auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Asserts admin role; returns error response or null.
 *
 * @param {NextRequest} req - Incoming request
 * @returns {Promise<NextResponse | null>} Error response if not admin, null if ok
 */
const requireAdmin = async (req: NextRequest): Promise<NextResponse | null> => {
  const session = await extractSession(req.headers.get('authorization'));
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.role !== 'admin') {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 },
    );
  }
  return null;
};

/**
 * GET /api/auth/users — List all users (admin only).
 * Returns public user info (no password hashes).
 *
 * @param {NextRequest} req - Incoming request
 * @returns {NextResponse} JSON array of users
 */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  const users = await getUserAdapter().listAll();

  return NextResponse.json(
    users.map(({ id, username, role, createdAt, lastLoginAt }) => ({
      id,
      username,
      role,
      createdAt,
      lastLoginAt,
    })),
  );
}

/**
 * POST /api/auth/users — Create a new user (admin only).
 *
 * @param {NextRequest} req - Request with JSON body `{ username, password, role? }`
 * @returns {NextResponse} Created user (no hash) or error
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = CreateUserRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  try {
    const user = await createUser(parsed.data);
    return NextResponse.json(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create user',
      },
      { status: 409 },
    );
  }
}
