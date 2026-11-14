/**
 * @fileoverview Dev builder API index; lists endpoints, slots, and flag codes. 404 unless `IK_DEV_BUILDER=1` outside production.
 *
 * @module src/app/api/dev/builder/route
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 *
 * @example
 * GET /api/dev/builder
 * → { endpoints, slots, flagCodes }
 */

import { handle } from '@/modules/character-builder/infrastructure/devApi/devApiHttp';
import { BUILDER_SLOTS } from '@/modules/character-builder/infrastructure/devApi/slotOptions';
import type { NextResponse } from 'next/server';

/**
 * Flag codes the API can emit, in emit order.
 *
 * @constant FLAG_CODES
 * @type {readonly string[]}
 */
const FLAG_CODES = [
  'BP_OVER_BUDGET',
  'UNASSIGNED_LEVELS',
  'UNASSIGNED_SKILL_PROFICIENCY',
  'UNASSIGNED_SKILL_EXPERTISE',
  'UNASSIGNED_TRADE',
  'UNASSIGNED_FEAT',
  'CARRY_HEAVY_LOAD',
  'CARRY_OVER_CAPACITY',
] as const;

/**
 * GET /api/dev/builder
 *
 * Returns the endpoint list, slot names, and flag codes.
 *
 * @returns {Promise<NextResponse>} JSON index, or 404 when disabled
 */
export async function GET(): Promise<NextResponse> {
  return handle('describe the builder API', async () => ({
    endpoints: {
      'POST /api/dev/builder/create': '{ payload, locale?, threshold?, carry? }',
      'POST /api/dev/builder/state': '{ character, carry? }',
      'POST /api/dev/builder/patch':
        '{ character, patch?, payload?, locale?, threshold?, carry? }',
      'POST /api/dev/builder/options': '{ slot, character?, vocationIndex?, locale? }',
    },
    slots: BUILDER_SLOTS,
    flagCodes: FLAG_CODES,
  }));
}
