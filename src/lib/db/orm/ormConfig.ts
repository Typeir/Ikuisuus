/**
 * @fileoverview MikroORM Configuration
 * @description Code-first configuration for MikroORM using the PostgreSQL driver.
 * References all entity classes — no code generation needed.
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
    BloodlineEntity,
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
