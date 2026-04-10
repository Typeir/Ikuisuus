/**
 * VocationMetadata Schema Unit Tests
 *
 * @fileoverview Tests for vocation metadata domain schema type exports.
 *
 * @module tests/unit/lib/db/content/schemas/vocationMetadata
 */

import type {
    VocationFeature,
    VocationIndexEntry,
    VocationMetadata,
    VocationSkillProficiencies,
    VocationSpellcasting,
} from '@/lib/db/content/schemas/vocationMetadata';
import { describe, expect, it } from 'vitest';

describe('VocationMetadata Schema', () => {
  it('should accept a valid VocationFeature', () => {
    const feature: VocationFeature = {
      level: 1,
      name: 'Rage',
    };

    expect(feature.level).toBe(1);
    expect(feature.name).toBe('Rage');
  });

  it('should accept VocationSpellcasting', () => {
    const casting: VocationSpellcasting = {
      ability: 'Charisma',
      progression: 'Full',
    };

    expect(casting.ability).toBe('Charisma');
    expect(casting.progression).toBe('Full');
  });

  it('should accept VocationSkillProficiencies', () => {
    const skills: VocationSkillProficiencies = {
      count: 2,
      choices: ['Athletics', 'Intimidation', 'Survival'],
    };

    expect(skills.count).toBe(2);
    expect(skills.choices).toHaveLength(3);
  });

  it('should accept a complete VocationMetadata record', () => {
    const metadata: VocationMetadata = {
      slug: 'barbarian',
      title: 'Barbarian',
      file: 'src/content/en/character-creation/vocations/barbarian/main.mdx',
      link: '/library/character-creation/vocations/barbarian',
      archetype: 'Martial',
      primaryAbility: ['Strength'],
      hitDie: 'd12',
      savingThrows: ['Strength', 'Constitution'],
      armorProficiencies: ['Light armor', 'Medium armor', 'Shields'],
      weaponProficiencies: ['Simple weapons', 'Martial weapons'],
      toolProficiencies: [],
      skillProficiencies: {
        count: 2,
        choices: ['Athletics', 'Intimidation', 'Survival'],
      },
      specializations: ['path-of-the-berserker', 'path-of-the-totem'],
      features: [{ level: 1, name: 'Rage' }],
      tags: ['archetype:martial'],
      indexVersion: 1,
    };

    expect(metadata.slug).toBe('barbarian');
    expect(metadata.hitDie).toBe('d12');
    expect(metadata.features).toHaveLength(1);
  });

  it('should accept a minimal VocationMetadata without optional fields', () => {
    const minimal: VocationMetadata = {
      slug: 'barbarian',
      title: 'Barbarian',
      file: 'barbarian.mdx',
      link: '/library/vocations/barbarian',
      archetype: 'Martial',
      primaryAbility: ['Strength'],
      hitDie: 'd12',
      savingThrows: ['Strength', 'Constitution'],
      armorProficiencies: [],
      weaponProficiencies: [],
      toolProficiencies: [],
      skillProficiencies: { count: 2, choices: [] },
      specializations: [],
      features: [],
      tags: [],
    };

    expect(minimal.spellcasting).toBeUndefined();
    expect(minimal.indexVersion).toBeUndefined();
  });

  it('should accept a VocationIndexEntry projection', () => {
    const entry: VocationIndexEntry = {
      slug: 'barbarian',
      title: 'Barbarian',
      hitDie: 'd12',
      archetype: 'Martial',
      primaryAbility: ['Strength'],
    };

    expect(entry.slug).toBeDefined();
    expect(entry.hitDie).toBe('d12');
  });
});
