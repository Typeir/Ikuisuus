/**
 * Monster Metadata Schema Unit Tests
 *
 * @fileoverview Tests for the monster metadata domain schema type exports.
 *
 * @module tests/unit/lib/db/content/schemas/monsterMetadata
 */

import type {
    AbilityScore,
    AbilityScores,
    MonsterAC,
    MonsterHP,
    MonsterIndexEntry,
    MonsterMetadata,
    MonsterSenses,
    MonsterSpeed,
} from '@/lib/db/content/schemas/monsterMetadata';
import { describe, expect, it } from 'vitest';

describe('MonsterMetadata Schema', () => {
  it('should accept a valid MonsterMetadata object', () => {
    const monster: MonsterMetadata = {
      slug: 'goblin',
      title: 'Goblin',
      file: 'src/content/en/monsters/goblin.sheet.mdx',
      link: '/library/monsters/goblin',
      size: 'small',
      creatureType: 'humanoid',
      cr: '1/4',
    };

    expect(monster.slug).toBe('goblin');
    expect(monster.size).toBe('small');
    expect(monster.cr).toBe('1/4');
  });

  it('should accept a minimal MonsterMetadata with only required fields', () => {
    const minimal: MonsterMetadata = {
      slug: 'blob',
      title: 'Blob',
      file: 'blob.sheet.mdx',
      link: '/library/monsters/blob',
    };

    expect(minimal.slug).toBe('blob');
    expect(minimal.abilities).toBeUndefined();
    expect(minimal.ac).toBeUndefined();
  });

  it('should accept MonsterAC with all fields', () => {
    const ac: MonsterAC = {
      value: 18,
      notes: 'plate armor',
      raw: '18 (plate armor)',
    };

    expect(ac.value).toBe(18);
    expect(ac.notes).toBe('plate armor');
  });

  it('should accept MonsterHP with all fields', () => {
    const hp: MonsterHP = {
      average: 168,
      formula: '16d12+80',
      raw: '168 (16d12+80)',
    };

    expect(hp.average).toBe(168);
    expect(hp.formula).toBe('16d12+80');
  });

  it('should accept MonsterSpeed with modes', () => {
    const speed: MonsterSpeed = {
      raw: '30 ft., fly 60 ft.',
      modes: { walk: 30, fly: 60 },
    };

    expect(speed.modes.walk).toBe(30);
    expect(speed.modes.fly).toBe(60);
  });

  it('should accept AbilityScores (mod derived, not stored)', () => {
    const score: AbilityScore = { score: 20 };
    expect(score.score).toBe(20);

    const abilities: AbilityScores = {
      str: { score: 20 },
      dex: { score: 10 },
      con: { score: 16 },
      int: { score: 8 },
      wis: { score: 12 },
      cha: { score: 14 },
    };

    expect(abilities.str.score).toBe(20);
    expect(abilities.int.score).toBe(8);
    expect(Math.floor(((abilities.str.score ?? 10) - 10) / 2)).toBe(5);
    expect(Math.floor(((abilities.int.score ?? 10) - 10) / 2)).toBe(-1);
  });

  it('should accept MonsterSenses', () => {
    const senses: MonsterSenses = {
      raw: 'darkvision 120 ft., passive Perception 15',
      passivePerception: 15,
      darkvision: 120,
    };

    expect(senses.passivePerception).toBe(15);
    expect(senses.darkvision).toBe(120);
  });

  it('should accept MonsterIndexEntry', () => {
    const entry: MonsterIndexEntry = {
      slug: 'dragon-red',
      title: 'Red Dragon',
      cr: '24',
      size: 'gargantuan',
      creatureType: 'dragon',
    };

    expect(entry.slug).toBe('dragon-red');
    expect(entry.cr).toBe('24');
  });

  it('should support subSlug for multi-stat-block monsters', () => {
    const variant: MonsterMetadata = {
      slug: 'albedo-the-bleak-bloom',
      subSlug: 'petal-form',
      title: 'Albedo (Petal Form)',
      file: 'albedo-the-bleak-bloom.sheet.mdx',
      link: '/library/monsters/albedo-the-bleak-bloom',
    };

    expect(variant.subSlug).toBe('petal-form');
  });
});
