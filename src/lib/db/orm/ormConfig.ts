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

import { defineConfig } from '@mikro-orm/postgresql';
import {
    CorrectionsUserEntity,
    HeirloomChargesEmbed,
    HeirloomEntity,
    MonsterACEmbed,
    MonsterEntity,
    MonsterHPEmbed,
    MonsterSaveEmbed,
    MonsterScoreEmbed,
    MonsterSenseEmbed,
    MonsterSpeedEmbed,
    SchemaMigrationEntity,
    SpellComponentEmbed,
    SpellEntity,
    SpellListEntity,
    TrinketEntity,
    TrinketSavingThrowEmbed,
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
  entities: [
    MonsterEntity,
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
    CorrectionsUserEntity,
    SchemaMigrationEntity,
  ],
  debug: process.env.NODE_ENV !== 'production',
});
