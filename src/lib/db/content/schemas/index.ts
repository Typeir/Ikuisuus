/**
 * @fileoverview Schema Barrel Export
 * @description Re-exports all domain metadata schemas from a single entry point.
 *
 * @module lib/db/content/schemas
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

export type {
    BloodlineBoon,
    BloodlineCoreFeatures,
    BloodlineIndexEntry,
    BloodlineMetadata
} from './bloodlineMetadata';

export type {
    MonsterAC,
    MonsterHP,
    MonsterIndexEntry,
    MonsterMetadata,
    MonsterSenses,
    MonsterSpeed
} from './monsterMetadata';

export type { HeirloomIndexEntry, HeirloomMetadata } from './heirloomMetadata';

export type {
    SpellIndexEntry,
    SpellListRef,
    SpellMetadata
} from './spellMetadata';

export type { DraftInput, DraftMetadata, DraftStatus } from './draftMetadata';
export type { TrinketIndexEntry, TrinketMetadata } from './trinketMetadata';

export type {
    AlwaysPreparedSpells,
    SpecializationFeature,
    SpecializationIndexEntry,
    SpecializationMetadata,
    SpecializationSpellcasting
} from './specializationMetadata';

export type {
    VocationFeature,
    VocationIndexEntry,
    VocationMetadata,
    VocationSkillProficiencies,
    VocationSpellcasting
} from './vocationMetadata';

export type { FeatAbilityIncrease, FeatMetadata } from './featMetadata';

