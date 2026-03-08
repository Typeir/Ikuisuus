/**
 * @fileoverview Content Module — Public Barrel Export
 * @description Re-exports the public API surface for the content metadata system.
 * Import from `@/lib/db/content` instead of reaching into individual files.
 *
 * @module lib/db/content
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

export type { ContentAdapter, ContentCategory } from './contentAdapter';

export {
    getContentAdapter,
    listHeirlooms,
    listMetadata,
    listMetadataBySlugs,
    listMonsters,
    listSpells,
    listTrinkets,
    setContentAdapter
} from './contentService';

export { fsContentAdapter } from './fsContentAdapter';
export { postgresContentAdapter } from './postgresContentAdapter';

