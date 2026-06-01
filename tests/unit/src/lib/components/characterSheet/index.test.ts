/**
 * @fileoverview Smoke tests for character sheet barrel exports
 * @description Verifies all public symbols are exported from the barrel index.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest - Test framework
 * @requires @/lib/components/characterSheet - Barrel index
 */

import { beforeAll, describe, expect, it } from 'vitest';

type CharacterSheetBarrel = typeof import('@/lib/components/characterSheet');

let barrel: CharacterSheetBarrel;

describe('characterSheet barrel index', () => {
  beforeAll(async () => {
    barrel = await import('@/lib/components/characterSheet');
  });

  it('should export AbilityScoreBlock', async () => {
    const { AbilityScoreBlock } = barrel;
    expect(AbilityScoreBlock).toBeDefined();
  });

  it('should export AttacksTable', async () => {
    const { AttacksTable } = barrel;
    expect(AttacksTable).toBeDefined();
  });

  it('should export BoonPicker', async () => {
    const { BoonPicker } = barrel;
    expect(BoonPicker).toBeDefined();
  });

  it('should export CharacterRoster', async () => {
    const { CharacterRoster } = barrel;
    expect(CharacterRoster).toBeDefined();
  });

  it('should export CharacterSheet', async () => {
    const { CharacterSheet } = barrel;
    expect(CharacterSheet).toBeDefined();
  });

  it('should export ActiveCharacterSheet', async () => {
    const { ActiveCharacterSheet } = barrel;
    expect(ActiveCharacterSheet).toBeDefined();
  });

  it('should export CombatStatsRow', async () => {
    const { CombatStatsRow } = barrel;
    expect(CombatStatsRow).toBeDefined();
  });

  it('should export FeatureViewer', async () => {
    const { FeatureViewer } = barrel;
    expect(FeatureViewer).toBeDefined();
  });

  it('should export NotesSection', async () => {
    const { NotesSection } = barrel;
    expect(NotesSection).toBeDefined();
  });

  it('should export ShardDisplay', async () => {
    const { ShardDisplay } = barrel;
    expect(ShardDisplay).toBeDefined();
  });

  it('should export ContentShardPanel', async () => {
    const { ContentShardPanel } = barrel;
    expect(ContentShardPanel).toBeDefined();
  });

  it('should export SkillsTable', async () => {
    const { SkillsTable } = barrel;
    expect(SkillsTable).toBeDefined();
  });
});
