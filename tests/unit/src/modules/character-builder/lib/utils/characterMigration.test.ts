/**
 * @fileoverview Tests for the persisted character upgrade.
 * @description An old sheet's Intelligence becomes its Wisdom, its skills are
 * rebuilt on the current list with tiers carried across the Perception split,
 * and its flat armour class becomes Deflect and Dodge; a current sheet passes
 * through unchanged
 *
 * @module tests/unit/src/modules/character-builder/lib/utils/characterMigration.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-16
 */

import {
  type LegacyCharacter,
  migrateCharacter,
  migrateSkills,
} from '@/modules/character-builder/lib/utils/characterMigration';
import { createEmptyCharacter } from '@/modules/character-builder/lib/utils/characterStorage';
import { describe, expect, it } from 'vitest';

/**
 * A sheet as the six-ability, flat-AC version saved it.
 *
 * @returns {LegacyCharacter} The old shape
 */
const legacy = (): LegacyCharacter => {
  const base = createEmptyCharacter() as unknown as LegacyCharacter;
  return {
    ...base,
    abilityScores: { str: 10, dex: 16, con: 12, int: 14, wis: 8, cha: 10 },
    savingThrows: { str: 'none', dex: 'none', con: 'none', int: 'proficient', wis: 'expertise', cha: 'none' },
    skills: [
      { name: 'skills.perception', ability: 'wis', tier: 'expertise' },
      { name: 'skills.animalHandling', ability: 'wis', tier: 'proficient' },
      { name: 'skills.arcana', ability: 'int', tier: 'familiarity' },
      { name: 'skills.insight', ability: 'wis', tier: 'proficient' },
    ],
    ac: 17,
    manualStatOverrides: ['ac', 'hp'],
    deflect: undefined,
    dodge: undefined,
  };
};

describe('migrateSkills', () => {
  it('rebuilds the list on the defaults, splitting Perception and dropping Animal Handling', () => {
    const skills = migrateSkills(legacy().skills);
    const tier = (name: string) => skills.find((s) => s.name === name)?.tier;
    const ability = (name: string) => skills.find((s) => s.name === name)?.ability;
    expect(skills).toHaveLength(19);
    expect(tier('skills.descry')).toBe('expertise');
    expect(tier('skills.discern')).toBe('expertise');
    expect(tier('skills.arcana')).toBe('familiarity');
    expect(ability('skills.arcana')).toBe('wis');
    expect(ability('skills.insight')).toBe('cha');
    expect(tier('skills.stealth')).toBe('none');
    expect(skills.some((s) => s.name === 'skills.animalHandling')).toBe(false);
  });
});

describe('migrateCharacter', () => {
  it('makes the old Intelligence the Wisdom score and save', () => {
    const next = migrateCharacter(legacy());
    expect(next.abilityScores).toEqual({ str: 10, dex: 16, con: 12, wis: 14, cha: 10 });
    expect(next.savingThrows.wis).toBe('proficient');
    expect('int' in next.abilityScores).toBe(false);
    expect('int' in next.savingThrows).toBe(false);
  });

  it('splits a flat armour class into Dodge from Dexterity and Deflect from the rest', () => {
    const next = migrateCharacter(legacy());
    expect(next.dodge).toBe(3);
    expect(next.deflect).toBe(4);
    expect('ac' in next).toBe(false);
    expect(next.manualStatOverrides).toEqual(['defence', 'hp']);
  });

  it('passes a current sheet through unchanged', () => {
    const current = { ...createEmptyCharacter(), deflect: 2, dodge: 1 };
    const next = migrateCharacter(current as unknown as LegacyCharacter);
    expect(next.deflect).toBe(2);
    expect(next.dodge).toBe(1);
    expect(next.abilityScores).toEqual(current.abilityScores);
    expect(next.skills).toEqual(current.skills);
  });
});
