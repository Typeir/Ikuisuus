/**
 * @fileoverview Dev builder create route; builds a character from a structured payload. 404 unless enabled.
 *
 * @module src/app/api/dev/builder/create/route
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 *
 * @example
 * POST /api/dev/builder/create { "payload": { "bloodline": "empyrean", "vocations": [{ "vocation": "wizard", "level": 3 }] } }
 * → { character, resolution, notes, state, flags }
 */

import type { BuilderPayload } from '@/modules/character-builder/application/builderCore/types';
import { createBuilderContent } from '@/modules/character-builder/infrastructure/devApi/builderContentSource';
import { buildCharacterFromPayload } from '@/modules/character-builder/infrastructure/devApi/buildCharacter';
import {
  BadRequestError,
  handle,
  readBody,
  readCarry,
  readLocale,
  readThreshold,
  snapshotOf,
} from '@/modules/character-builder/infrastructure/devApi/devApiHttp';
import type { NextResponse } from 'next/server';

/**
 * POST /api/dev/builder/create
 *
 * Builds a new character; names are fuzzy-resolved and flags never block.
 *
 * @param {Request} req - Request with `{ payload, locale?, threshold?, carry? }`
 * @returns {Promise<NextResponse>} JSON snapshot with resolution and notes
 */
export async function POST(req: Request): Promise<NextResponse> {
  return handle('create character', async () => {
    const body = await readBody(req);
    if (typeof body.payload !== 'object' || body.payload === null) {
      throw new BadRequestError('Missing or invalid field: payload');
    }
    const content = createBuilderContent(readLocale(body));
    const built = await buildCharacterFromPayload(
      body.payload as BuilderPayload,
      content,
      { threshold: readThreshold(body) },
    );
    return {
      ...snapshotOf(built.character, readCarry(body)),
      resolution: built.resolution,
      notes: built.notes,
    };
  });
}
