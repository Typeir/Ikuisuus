/**
 * @fileoverview Feat Content Shards API Route
 * @description Returns named prose shards for a specific feat. Feats currently
 * expose only the `main` shard (full page body).
 *
 * @module src/app/api/content-shards/feats/[slug]/route
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { featRepository } from '@/lib/db/content/repositories/featRepository';
import { shardRouteFor } from '../../shardRoute';

/** GET /api/content-shards/feats/[slug] via the shared shard-route handler. */
export const GET = shardRouteFor({
  label: 'Feat',
  shardType: 'feat',
  getMeta: (locale, slug) => featRepository.getBySlug(locale, slug),
  entriesOf: (meta) => meta.features,
});
