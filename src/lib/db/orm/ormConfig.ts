/**
 * @fileoverview MikroORM Configuration
 * @description Code-first MikroORM config with PostgreSQL, all entities referenced.
 *
 * @module lib/db/orm/ormConfig
 * @version 2.0.0
 * @author Typeir
 * @since 5.0.0
 */

import { toSchemas } from '@/lib/db/orm/schema';
import { defineConfig } from '@mikro-orm/postgresql';
import {
    AuditRecordEntity,
    BannedIpEntity,
    BloodlineBoonEntity,
    BloodlineBoonOptionEntity,
    BloodlineEntity,
    BloodlineFeatureEntity,
    CorrectionsUserEntity,
    DraftEntity,
    FeatAbilityIncreaseEmbed,
    FeatEntity,
    FeatFeatureEntity,
    HeirloomChargesEmbed,
    HeirloomEntity,
    MonsterACEmbed,
    MonsterEntity,
    MonsterFeatureEntity,
    MonsterHPEmbed,
    MonsterSaveEmbed,
    MonsterScoreEmbed,
    MonsterSenseEmbed,
    MonsterSpeedEmbed,
    RuleEntity,
    SchemaMigrationEntity,
    SpecializationEntity,
    SpecializationFeatureEntity,
    SpecializationPreparedSpellEntity,
    SpecializationSpellcastingEmbed,
    SpellComponentEmbed,
    SpellEntity,
    SpellListEntity,
    TrinketEntity,
    TrinketSavingThrowEmbed,
    VocationEntity,
    VocationFeatureEntity,
    VocationSkillProficienciesEmbed,
    VocationSpellcastingEmbed,
    WorldEntity,
} from './entities';

export const ormConfig = defineConfig({
  clientUrl: process.env.DATABASE_URL,
  driverOptions: {
    connection: {
      ssl:
        process.env.DATABASE_SSL === 'false'
          ? false
          : { rejectUnauthorized: false },
    },
  },
  entities: toSchemas([
    AuditRecordEntity,
    BannedIpEntity,
    BloodlineEntity,
    BloodlineBoonEntity,
    BloodlineBoonOptionEntity,
    BloodlineFeatureEntity,
    DraftEntity,
    FeatEntity,
    FeatFeatureEntity,
    FeatAbilityIncreaseEmbed,
    MonsterEntity,
    MonsterFeatureEntity,
    MonsterACEmbed,
    MonsterHPEmbed,
    MonsterSpeedEmbed,
    MonsterScoreEmbed,
    MonsterSaveEmbed,
    MonsterSenseEmbed,
    HeirloomEntity,
    HeirloomChargesEmbed,
    SpellEntity,
    SpellComponentEmbed,
    SpellListEntity,
    TrinketEntity,
    TrinketSavingThrowEmbed,
    RuleEntity,
    WorldEntity,
    VocationEntity,
    VocationFeatureEntity,
    VocationSkillProficienciesEmbed,
    VocationSpellcastingEmbed,
    SpecializationEntity,
    SpecializationFeatureEntity,
    SpecializationPreparedSpellEntity,
    SpecializationSpellcastingEmbed,
    CorrectionsUserEntity,
    SchemaMigrationEntity,
  ]),
  debug: process.env.NODE_ENV !== 'production',
});
