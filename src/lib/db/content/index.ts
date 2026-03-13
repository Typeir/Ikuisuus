/**
 * @fileoverview Content Module — Public Barrel Export
 * @description Re-exports the public API surface for the content metadata system.
 * Import from `@/lib/db/content` instead of reaching into individual files.
 *
 * Preferred entry points (new architecture):
 * - Factory-resolved repositories from `./repositories`
 * - Entity schemas from `./schemas`
 * - Repository port interfaces from `./repositories`
 * - FS adapters from `./adapters/fs`
 * - PG adapters from `./adapters/pg`
 *
 * Legacy shim (deprecated — will be removed in next major):
 * - `setContentAdapter` / `getContentAdapter` / `listMonsters` / etc. from `./contentService`
 *
 * @module lib/db/content
 * @version 3.0.0
 * @author Typeir
 * @since 3.0.0
 */

/** Factory-resolved repository instances — the primary public API */
export {
    draftRepository,
    heirloomRepository,
    monsterRepository,
    spellRepository,
    trinketRepository
} from './repositories';

/** Entity-specific domain schemas */
export type {
    HeirloomIndexEntry,
    HeirloomMetadata,
    HeirloomWeaponDamage
} from './schemas/heirloomMetadata';

export type {
    AbilityScore,
    AbilityScores,
    MonsterAC,
    MonsterHP,
    MonsterIndexEntry,
    MonsterMetadata,
    MonsterSenses,
    MonsterSpeed
} from './schemas/monsterMetadata';

export type {
    SpellIndexEntry,
    SpellListRef,
    SpellMetadata
} from './schemas/spellMetadata';

export type {
    TrinketIndexEntry,
    TrinketMetadata
} from './schemas/trinketMetadata';

export type {
    DraftInput,
    DraftMetadata,
    DraftStatus
} from './schemas/draftMetadata';

/** Repository port interfaces */
export type { DraftRepository } from './repositories/draftRepository';
export type { HeirloomRepository } from './repositories/heirloomRepository';
export type { MonsterRepository } from './repositories/monsterRepository';
export type { SpellRepository } from './repositories/spellRepository';
export type { TrinketRepository } from './repositories/trinketRepository';

/** Content source adapter interface and cache tag utility */
export { contentCacheTag } from './contentCacheTags';
export type {
    ContentFetchResult,
    ContentSourceAdapter
} from './contentSourceAdapter';

