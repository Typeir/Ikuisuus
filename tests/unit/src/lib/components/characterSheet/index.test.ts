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

import { describe, expect, it } from 'vitest';

describe('characterSheet barrel index', () => {
  it('should export AbilityScoreBlock', async () => {
    const { AbilityScoreBlock } =
      await import('@/lib/components/characterSheet');
    expect(AbilityScoreBlock).toBeDefined();
  });

  it('should export AttacksTable', async () => {
    const { AttacksTable } = await import('@/lib/components/characterSheet');
    expect(AttacksTable).toBeDefined();
  });

  it('should export BoonPicker', async () => {
    const { BoonPicker } = await import('@/lib/components/characterSheet');
    expect(BoonPicker).toBeDefined();
  });

  it('should export CharacterRoster', async () => {
    const { CharacterRoster } = await import('@/lib/components/characterSheet');
    expect(CharacterRoster).toBeDefined();
  });

  it('should export CharacterSheet', async () => {
    const { CharacterSheet } = await import('@/lib/components/characterSheet');
    expect(CharacterSheet).toBeDefined();
  });

  it('should export ActiveCharacterSheet', async () => {
    const { ActiveCharacterSheet } =
      await import('@/lib/components/characterSheet');
    expect(ActiveCharacterSheet).toBeDefined();
  });

  it('should export CombatStatsRow', async () => {
    const { CombatStatsRow } = await import('@/lib/components/characterSheet');
    expect(CombatStatsRow).toBeDefined();
  });

  it('should export FeatureViewer', async () => {
    const { FeatureViewer } = await import('@/lib/components/characterSheet');
    expect(FeatureViewer).toBeDefined();
  });

  it('should export NotesSection', async () => {
    const { NotesSection } = await import('@/lib/components/characterSheet');
    expect(NotesSection).toBeDefined();
  });

  it('should export ShardDisplay', async () => {
    const { ShardDisplay } = await import('@/lib/components/characterSheet');
    expect(ShardDisplay).toBeDefined();
  });

  it('should export ContentShardPanel', async () => {
    const { ContentShardPanel } = await import(
      '@/lib/components/characterSheet'
    );
    expect(ContentShardPanel).toBeDefined();
  });

  it('should export SkillsTable', async () => {
    const { SkillsTable } = await import('@/lib/components/characterSheet');
    expect(SkillsTable).toBeDefined();
  });
});
