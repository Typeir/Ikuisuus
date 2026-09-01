/**
 * Entity Barrel Export Unit Tests
 *
 * @fileoverview Tests that the entities barrel re-exports all expected classes.
 *
 * @module tests/unit/src/lib/db/orm/entities/index.test
 */

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
    RuleEntity,
    TrinketEntity,
    WorldEntity,
    TrinketSavingThrowEmbed,
} from '@/lib/db/orm/entities';
import { describe, expect, it } from 'vitest';

describe('entities/index barrel', () => {
  it('should re-export all entity classes', () => {
    expect(CorrectionsUserEntity).toBeDefined();
    expect(MonsterEntity).toBeDefined();
    expect(SpellEntity).toBeDefined();
    expect(SpellListEntity).toBeDefined();
    expect(HeirloomEntity).toBeDefined();
    expect(TrinketEntity).toBeDefined();
    expect(RuleEntity).toBeDefined();
    expect(WorldEntity).toBeDefined();
    expect(SchemaMigrationEntity).toBeDefined();
  });

  it('should re-export all embeddable classes', () => {
    expect(MonsterACEmbed).toBeDefined();
    expect(MonsterHPEmbed).toBeDefined();
    expect(MonsterSpeedEmbed).toBeDefined();
    expect(MonsterScoreEmbed).toBeDefined();
    expect(MonsterSaveEmbed).toBeDefined();
    expect(MonsterSenseEmbed).toBeDefined();
    expect(SpellComponentEmbed).toBeDefined();
    expect(HeirloomChargesEmbed).toBeDefined();
    expect(TrinketSavingThrowEmbed).toBeDefined();
  });
});
