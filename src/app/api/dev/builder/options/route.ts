/**
 * @fileoverview Dev builder options route; lists valid options for one slot. 404 unless enabled.
 *
 * @module src/app/api/dev/builder/options/route
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 *
 * @example
 * POST /api/dev/builder/options { "slot": "specialization", "character": { ... }, "vocationIndex": 0 }
 * → { slot, options: [{ slug, title, info }] }
 */

import { createEmptyCharacter } from '@/modules/character-builder/lib/utils/characterStorage';
import { createBuilderContent } from '@/modules/character-builder/infrastructure/devApi/builderContentSource';
import {
  BadRequestError,
  handle,
  readBody,
  readCharacter,
  readLocale,
} from '@/modules/character-builder/infrastructure/devApi/devApiHttp';
import {
  BUILDER_SLOTS,
  isBuilderSlot,
  listSlotOptions,
} from '@/modules/character-builder/infrastructure/devApi/slotOptions';
import type { NextResponse } from 'next/server';

/**
 * POST /api/dev/builder/options
 *
 * Lists slot options relative to `character`, or an empty character when omitted.
 *
 * @param {Request} req - Request with `{ slot, character?, vocationIndex?, locale? }`
 * @returns {Promise<NextResponse>} JSON option list
 */
export async function POST(req: Request): Promise<NextResponse> {
  return handle('list options', async () => {
    const body = await readBody(req);
    if (!isBuilderSlot(body.slot)) {
      throw new BadRequestError(`slot must be one of: ${BUILDER_SLOTS.join(', ')}`);
    }
    const character =
      body.character === undefined ? createEmptyCharacter() : readCharacter(body);
    const vocationIndex =
      typeof body.vocationIndex === 'number' ? body.vocationIndex : 0;
    const options = await listSlotOptions(
      body.slot,
      character,
      createBuilderContent(readLocale(body)),
      vocationIndex,
    );
    return { slot: body.slot, options };
  });
}
