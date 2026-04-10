/**
 * SpecializationEntity Unit Tests
 *
 * @fileoverview Tests for the Specialization MikroORM entity and its embeddables.
 *
 * @module tests/unit/lib/db/orm/entities/SpecializationEntity
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import {
    SpecializationEntity,
    SpecializationSpellcastingEmbed,
} from '@/lib/db/orm/entities/SpecializationEntity';
import { describe, expect, it } from 'vitest';

describe('SpecializationEntity', () => {
  it('should be constructable', () => {
    const entity = new SpecializationEntity();
    expect(entity).toBeInstanceOf(SpecializationEntity);
  });

  it('should initialise array fields as empty arrays', () => {
    const entity = new SpecializationEntity();
    expect(entity.tags).toEqual([]);
  });

  it('should accept scalar field assignments', () => {
    const entity = new SpecializationEntity();
    entity.locale = 'en';
    entity.slug = 'path-of-the-berserker';
    entity.title = 'Path of the Berserker';
    entity.file = 'berserker.mdx';
    entity.link = '/library/vocations/barbarian/path-of-the-berserker';
    entity.vocation = 'barbarian';
    entity.specializationType = 'Path';

    expect(entity.slug).toBe('path-of-the-berserker');
    expect(entity.vocation).toBe('barbarian');
    expect(entity.specializationType).toBe('Path');
  });

  it('should accept nullable fields', () => {
    const entity = new SpecializationEntity();
    entity.flavor = 'A warrior driven by fury.';
    entity.indexVersion = 1;
    entity.versionHash = 'abc123';

    expect(entity.flavor).toBe('A warrior driven by fury.');
    expect(entity.indexVersion).toBe(1);
  });
});

describe('SpecializationSpellcastingEmbed', () => {
  it('should be constructable', () => {
    const embed = new SpecializationSpellcastingEmbed();
    expect(embed).toBeInstanceOf(SpecializationSpellcastingEmbed);
  });

  it('should accept optional fields', () => {
    const embed = new SpecializationSpellcastingEmbed();
    embed.ability = 'Intelligence';
    embed.progression = 'Third';

    expect(embed.ability).toBe('Intelligence');
    expect(embed.progression).toBe('Third');
  });
});
