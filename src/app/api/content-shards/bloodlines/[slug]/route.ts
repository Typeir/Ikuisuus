/**
 * @fileoverview Bloodline Content Shards API Route
 * @description Returns named prose shards for a bloodline.
 *
 * @module src/app/api/content-shards/bloodlines/[slug]/route
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @example
 * ```
 * GET /api/content-shards/bloodlines/empyrean?locale=en
 * GET /api/content-shards/bloodlines/empyrean?locale=en&keys[]=main&keys[]=Extended+Reach
 * → { shardType: 'bloodline', shards: { main: '...', 'Extended Reach': '...' } }
 * ```
 */

import { bloodlineRepository } from '@/lib/db/content/repositories/bloodlineRepository';
import { shardRouteFor } from '../../shardRoute';

/** GET /api/content-shards/bloodlines/[slug] via the shared shard-route handler. */
export const GET = shardRouteFor({
  label: 'Bloodline',
  shardType: 'bloodline',
  getMeta: (locale, slug) => bloodlineRepository.getBySlug(locale, slug),
  entriesOf: (meta) => meta.boons,
});
