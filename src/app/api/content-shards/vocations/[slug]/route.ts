/**
 * @fileoverview Vocation Content Shards API Route
 * @description Returns named prose shards for a specific vocation.
 *
 * @module src/app/api/content-shards/vocations/[slug]/route
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @example
 * ```
 * GET /api/content-shards/vocations/Berserker?locale=en
 * GET /api/content-shards/vocations/Berserker?locale=en&keys[]=Rage&keys[]=Unarmored+Defense
 * → { shardType: 'vocation', shards: { Rage: '...', 'Unarmored Defense': '...' } }
 * ```
 */

import { vocationRepository } from '@/lib/db/content/repositories/vocationRepository';
import { shardRouteFor } from '../../shardRoute';

/** GET /api/content-shards/vocations/[slug] via the shared shard-route handler. */
export const GET = shardRouteFor({
  label: 'Vocation',
  shardType: 'vocation',
  getMeta: (locale, slug) => vocationRepository.getBySlug(locale, slug),
  entriesOf: (meta) => meta.features,
});
