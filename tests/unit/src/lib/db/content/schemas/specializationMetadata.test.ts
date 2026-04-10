/**
 * SpecializationMetadata Schema Unit Tests
 *
 * @fileoverview Tests for specialization metadata domain schema type exports.
 *
 * @module tests/unit/lib/db/content/schemas/specializationMetadata
 */

import type {
    AlwaysPreparedSpells,
    SpecializationFeature,
    SpecializationIndexEntry,
    SpecializationMetadata,
    SpecializationSpellcasting,
} from '@/lib/db/content/schemas/specializationMetadata';
import { describe, expect, it } from 'vitest';

describe('SpecializationMetadata Schema', () => {
  it('should accept a valid SpecializationFeature', () => {
    const feature: SpecializationFeature = {
      level: 3,
      name: 'Frenzy',
    };

    expect(feature.level).toBe(3);
    expect(feature.name).toBe('Frenzy');
  });

  it('should accept AlwaysPreparedSpells', () => {
    const prepared: AlwaysPreparedSpells = {
      level: 3,
      spells: ['Bless', 'Cure Wounds'],
    };

    expect(prepared.level).toBe(3);
    expect(prepared.spells).toHaveLength(2);
  });

  it('should accept SpecializationSpellcasting', () => {
    const casting: SpecializationSpellcasting = {
      ability: 'Intelligence',
      progression: 'Third',
    };

    expect(casting.ability).toBe('Intelligence');
    expect(casting.progression).toBe('Third');
  });

  it('should accept a complete SpecializationMetadata record', () => {
    const metadata: SpecializationMetadata = {
      slug: 'path-of-the-berserker',
      title: 'Path of the Berserker',
      file: 'src/content/en/character-creation/vocations/barbarian/path-of-the-berserker.mdx',
      link: '/library/character-creation/vocations/barbarian/path-of-the-berserker',
      vocation: 'barbarian',
      specializationType: 'Path',
      flavor: 'A warrior driven by fury.',
      features: [{ level: 3, name: 'Frenzy' }],
      tags: ['mechanic:melee'],
      indexVersion: 1,
    };

    expect(metadata.slug).toBe('path-of-the-berserker');
    expect(metadata.vocation).toBe('barbarian');
    expect(metadata.features).toHaveLength(1);
  });

  it('should accept a minimal SpecializationMetadata without optional fields', () => {
    const minimal: SpecializationMetadata = {
      slug: 'berserker',
      title: 'Berserker',
      file: 'berserker.mdx',
      link: '/library/vocations/barbarian/berserker',
      vocation: 'barbarian',
      specializationType: 'Path',
      features: [],
      tags: [],
    };

    expect(minimal.flavor).toBeUndefined();
    expect(minimal.spellcasting).toBeUndefined();
    expect(minimal.spellsAlwaysPrepared).toBeUndefined();
  });

  it('should accept a SpecializationIndexEntry projection', () => {
    const entry: SpecializationIndexEntry = {
      slug: 'path-of-the-berserker',
      title: 'Path of the Berserker',
      vocation: 'barbarian',
      specializationType: 'Path',
    };

    expect(entry.slug).toBeDefined();
    expect(entry.vocation).toBe('barbarian');
  });
});
