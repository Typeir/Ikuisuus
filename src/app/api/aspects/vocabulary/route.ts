/**
 * @fileoverview Aspect Vocabulary API Endpoint
 * @description GET returns the closed, authorable aspect vocabulary as
 * `{ groups: [{ group, values, scope }] }`, resolved from shared-data. Feeds
 * the editor's aspect picker.
 *
 * @module app/api/aspects/vocabulary/route
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { resolveAspectVocabulary } from '@/lib/metadata/aspectVocabulary';
import { loadSharedData } from '@scripts/metadata/sharedData';
import { NextResponse } from 'next/server';

/**
 * GET /api/aspects/vocabulary
 *
 * @returns {Promise<NextResponse>} Vocabulary groups
 */
export async function GET(): Promise<NextResponse> {
  const shared = await loadSharedData();
  const groups = resolveAspectVocabulary(shared as never);
  return NextResponse.json(
    { groups },
    { headers: { 'Cache-Control': 'public, max-age=300' } },
  );
}
