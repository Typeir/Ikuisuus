/**
 * VocationEntity Unit Tests
 *
 * @fileoverview Tests for the Vocation MikroORM entity and its embeddables.
 *
 * @module tests/unit/lib/db/orm/entities/VocationEntity
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import {
    VocationEntity,
    VocationSkillProficienciesEmbed,
    VocationSpellcastingEmbed,
} from '@/lib/db/orm/entities/VocationEntity';
import { describe, expect, it } from 'vitest';

describe('VocationEntity', () => {
  it('should be constructable', () => {
    const entity = new VocationEntity();
    expect(entity).toBeInstanceOf(VocationEntity);
  });

  it('should initialise array fields as empty arrays', () => {
    const entity = new VocationEntity();
    expect(entity.primaryAbility).toEqual([]);
    expect(entity.savingThrows).toEqual([]);
    expect(entity.armorProficiencies).toEqual([]);
    expect(entity.weaponProficiencies).toEqual([]);
    expect(entity.toolProficiencies).toEqual([]);
    expect(entity.specializations).toEqual([]);
    expect(entity.tags).toEqual([]);
  });

  it('should initialise skillProficiencies embed', () => {
    const entity = new VocationEntity();
    expect(entity.skillProficiencies).toBeInstanceOf(
      VocationSkillProficienciesEmbed,
    );
  });

  it('should accept scalar field assignments', () => {
    const entity = new VocationEntity();
    entity.locale = 'en';
    entity.slug = 'barbarian';
    entity.title = 'Barbarian';
    entity.file = 'barbarian.mdx';
    entity.link = '/library/vocations/barbarian';
    entity.archetype = 'Martial';
    entity.hitDie = 'd12';

    expect(entity.slug).toBe('barbarian');
    expect(entity.hitDie).toBe('d12');
  });

  it('should accept nullable fields', () => {
    const entity = new VocationEntity();
    entity.indexVersion = 1;
    entity.versionHash = 'abc123';

    expect(entity.indexVersion).toBe(1);
    expect(entity.versionHash).toBe('abc123');
  });
});

describe('VocationSkillProficienciesEmbed', () => {
  it('should be constructable', () => {
    const embed = new VocationSkillProficienciesEmbed();
    expect(embed).toBeInstanceOf(VocationSkillProficienciesEmbed);
  });

  it('should initialise choices as empty array', () => {
    const embed = new VocationSkillProficienciesEmbed();
    expect(embed.choices).toEqual([]);
  });
});

describe('VocationSpellcastingEmbed', () => {
  it('should be constructable', () => {
    const embed = new VocationSpellcastingEmbed();
    expect(embed).toBeInstanceOf(VocationSpellcastingEmbed);
  });

  it('should accept optional fields', () => {
    const embed = new VocationSpellcastingEmbed();
    embed.ability = 'Charisma';
    embed.progression = 'Full';

    expect(embed.ability).toBe('Charisma');
    expect(embed.progression).toBe('Full');
  });
});
