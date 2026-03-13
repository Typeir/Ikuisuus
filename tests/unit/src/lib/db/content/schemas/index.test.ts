/**
 * Schema Barrel Export Unit Tests
 *
 * @fileoverview Tests that the schema barrel re-exports all expected types.
 *
 * @module tests/unit/lib/db/content/schemas/index
 */

import type {
    AbilityScore,
    AbilityScores,
    HeirloomIndexEntry,
    HeirloomMetadata,
    HeirloomWeaponDamage,
    MonsterAC,
    MonsterHP,
    MonsterIndexEntry,
    MonsterMetadata,
    MonsterSenses,
    MonsterSpeed,
    SpellIndexEntry,
    SpellListRef,
    SpellMetadata,
    TrinketIndexEntry,
    TrinketMetadata,
} from '@/lib/db/content/schemas';
import { describe, expect, it } from 'vitest';

describe('schemas/index barrel', () => {
  it('should re-export monster types', () => {
    const monster: MonsterMetadata = {
      slug: 'test',
      title: 'Test',
      file: 'test.mdx',
      link: '/test',
    };
    const ac: MonsterAC = { value: 10 };
    const hp: MonsterHP = { average: 10 };
    const speed: MonsterSpeed = { raw: '30 ft.', modes: { walk: 30 } };
    const score: AbilityScore = { score: 10 };
    const scores: AbilityScores = {
      str: score,
      dex: score,
      con: score,
      int: score,
      wis: score,
      cha: score,
    };
    const senses: MonsterSenses = { raw: 'passive Perception 10' };
    const idx: MonsterIndexEntry = { slug: 'test', title: 'Test' };

    expect(monster.slug).toBe('test');
    expect(ac.value).toBe(10);
    expect(hp.average).toBe(10);
    expect(speed.modes.walk).toBe(30);
    expect(scores.str.score).toBe(10);
    expect(senses.raw).toContain('Perception');
    expect(idx.slug).toBe('test');
  });

  it('should re-export heirloom types', () => {
    const heirloom: HeirloomMetadata = {
      slug: 'test',
      title: 'Test',
      file: 'test.mdx',
      link: '/test',
    };
    const damage: HeirloomWeaponDamage = {
      damage: '1d8',
      damageType: 'slashing',
    };
    const idx: HeirloomIndexEntry = { slug: 'test', title: 'Test' };

    expect(heirloom.slug).toBe('test');
    expect(damage.damage).toBe('1d8');
    expect(idx.slug).toBe('test');
  });

  it('should re-export spell types', () => {
    const spell: SpellMetadata = {
      slug: 'test',
      title: 'Test',
      file: 'test.mdx',
      link: '/test',
    };
    const ref: SpellListRef = { name: 'Wizard', link: '/wizard' };
    const idx: SpellIndexEntry = { slug: 'test', title: 'Test' };

    expect(spell.slug).toBe('test');
    expect(ref.name).toBe('Wizard');
    expect(idx.slug).toBe('test');
  });

  it('should re-export trinket types', () => {
    const trinket: TrinketMetadata = {
      slug: 'test',
      title: 'Test',
      file: 'test.mdx',
      link: '/test',
      itemType: 'Gear',
    };
    const idx: TrinketIndexEntry = {
      slug: 'test',
      title: 'Test',
      itemType: 'Gear',
    };

    expect(trinket.slug).toBe('test');
    expect(idx.itemType).toBe('Gear');
  });
});
