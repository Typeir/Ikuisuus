/**
 * @fileoverview Specialization Content Shards API Route
 * @description Returns named prose shards for a specialization.
 *
 * @module src/app/api/content-shards/specializations/[slug]/route
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @example
 * ```
 * GET /api/content-shards/specializations/path-of-the-berserker?locale=en
 * → { shardType: 'specialization', shards: { main: '...', 'Frenzy': '...' } }
 * ```
 */

import { specializationRepository } from '@/lib/db/content/repositories/specializationRepository';
import { shardRouteFor } from '../../shardRoute';

/** GET /api/content-shards/specializations/[slug] via the shared shard-route handler. */
export const GET = shardRouteFor({
  label: 'Specialization',
  shardType: 'specialization',
  getMeta: (locale, slug) => specializationRepository.getBySlug(locale, slug),
  entriesOf: (meta) => meta.features,
});
