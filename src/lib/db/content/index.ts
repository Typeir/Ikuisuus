/**
 * @fileoverview Public barrel export for the content metadata system.
 * @description Re-exports repositories, schemas, port interfaces, adapters, and
 * file-tree services. Import from `@/lib/db/content` instead of individual files.
 * The legacy shim (`setContentAdapter`, `getContentAdapter`, `listMonsters`, etc.)
 * lives in `./contentService` and is deprecated.
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
    HeirloomMetadata
} from './schemas/heirloomMetadata';

export type {
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

/** File-tree service (lazy sidebar) */
export {
    clearCache,
    getFile,
    listDirectory,
    statPath
} from './fileTreeService';

