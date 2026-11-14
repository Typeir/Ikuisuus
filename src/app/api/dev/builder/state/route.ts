/**
 * @fileoverview Dev builder state route; returns computed state and flags for a character. 404 unless enabled.
 *
 * @module src/app/api/dev/builder/state/route
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 *
 * @example
 * POST /api/dev/builder/state { "character": { ... } }
 * → { character, state, flags }
 */

import {
  handle,
  readBody,
  readCarry,
  readCharacter,
  snapshotOf,
} from '@/modules/character-builder/infrastructure/devApi/devApiHttp';
import type { NextResponse } from 'next/server';

/**
 * POST /api/dev/builder/state
 *
 * Computes state and flags; the character is migrated, never settled or changed.
 *
 * @param {Request} req - Request with `{ character, carry? }`
 * @returns {Promise<NextResponse>} JSON snapshot
 */
export async function POST(req: Request): Promise<NextResponse> {
  return handle('compute state', async () => {
    const body = await readBody(req);
    return snapshotOf(readCharacter(body), readCarry(body));
  });
}
