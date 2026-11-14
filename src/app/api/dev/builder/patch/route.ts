/**
 * @fileoverview Dev builder patch route; applies a raw patch and/or payload and returns the diff. 404 unless enabled.
 *
 * @module src/app/api/dev/builder/patch/route
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 *
 * @example
 * POST /api/dev/builder/patch { "character": { ... }, "payload": { "boons": ["Extended Reach"] } }
 * → { character, state, flags, resolution, notes, diff: { character, state, flags } }
 */

import type { CharacterSheet } from '@/lib/types/character';
import { diffFlags, diffJson } from '@/modules/character-builder/application/builderCore/builderDiff';
import {
  applyCharacterPatch,
  settleCharacter,
} from '@/modules/character-builder/application/builderCore/builderMutations';
import type {
  BuilderPayload,
  Resolution,
} from '@/modules/character-builder/application/builderCore/types';
import { createBuilderContent } from '@/modules/character-builder/infrastructure/devApi/builderContentSource';
import { buildCharacterFromPayload } from '@/modules/character-builder/infrastructure/devApi/buildCharacter';
import {
  BadRequestError,
  handle,
  readBody,
  readCarry,
  readCharacter,
  readLocale,
  readThreshold,
  snapshotOf,
} from '@/modules/character-builder/infrastructure/devApi/devApiHttp';
import type { NextResponse } from 'next/server';

/**
 * True for a plain JSON object.
 *
 * @function isObject
 * @param {unknown} value - Candidate
 * @returns {boolean} True for a non-array object
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * POST /api/dev/builder/patch
 *
 * Applies `patch` (raw merge through the sheet reducer), then `payload` (additive build), then settles.
 *
 * @param {Request} req - Request with `{ character, patch?, payload?, locale?, threshold?, carry? }`
 * @returns {Promise<NextResponse>} JSON snapshot with resolution, notes, and diff
 */
export async function POST(req: Request): Promise<NextResponse> {
  return handle('patch character', async () => {
    const body = await readBody(req);
    if (!isObject(body.patch) && !isObject(body.payload)) {
      throw new BadRequestError('Provide patch and/or payload');
    }
    const carry = readCarry(body);
    const content = createBuilderContent(readLocale(body));
    const before = snapshotOf(readCharacter(body), carry);
    let character: CharacterSheet = before.character;
    let resolution: Resolution[] = [];
    let notes: string[] = [];
    if (isObject(body.patch)) {
      character = applyCharacterPatch(character, body.patch as Partial<CharacterSheet>);
    }
    if (isObject(body.payload)) {
      const built = await buildCharacterFromPayload(
        body.payload as BuilderPayload,
        content,
        { base: character, threshold: readThreshold(body) },
      );
      ({ character, resolution, notes } = built);
    } else {
      character = settleCharacter(character, await content.vocations());
    }
    const after = snapshotOf(character, carry);
    return {
      ...after,
      resolution,
      notes,
      diff: {
        character: diffJson(before.character, after.character),
        state: diffJson(before.state, after.state),
        flags: diffFlags(before.flags, after.flags),
      },
    };
  });
}
