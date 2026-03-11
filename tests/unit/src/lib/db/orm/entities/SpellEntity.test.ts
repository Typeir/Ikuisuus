/**
 * SpellEntity Unit Tests
 *
 * @fileoverview Tests for the Spell MikroORM entity, SpellListEntity,
 * and the SpellComponentEmbed value object.
 *
 * @module tests/unit/lib/db/orm/entities/SpellEntity
 */

import {
    SpellComponentEmbed,
    SpellEntity,
    SpellListEntity,
} from '@/lib/db/orm/entities/SpellEntity';
import { Collection } from '@mikro-orm/core';
import { describe, expect, it } from 'vitest';

describe('SpellEntity', () => {
  it('should be constructable with embedded and collection defaults', () => {
    const entity = new SpellEntity();

    expect(entity).toBeInstanceOf(SpellEntity);
    expect(entity.components).toBeInstanceOf(SpellComponentEmbed);
    expect(entity.spellLists).toBeInstanceOf(Collection);
  });

  it('should initialise array fields as empty arrays', () => {
    const entity = new SpellEntity();
    expect(entity.castingTime).toEqual([]);
    expect(entity.tags).toEqual([]);
  });

  it('should accept scalar field assignments', () => {
    const entity = new SpellEntity();
    entity.locale = 'en';
    entity.slug = 'fireball';
    entity.title = 'Fireball';
    entity.file = 'fireball.mdx';
    entity.link = '/en/library/spells/fireball';
    entity.level = 3;
    entity.school = 'Evocation';

    expect(entity.slug).toBe('fireball');
    expect(entity.level).toBe(3);
    expect(entity.school).toBe('Evocation');
  });
});

describe('SpellListEntity', () => {
  it('should be constructable', () => {
    const entity = new SpellListEntity();
    expect(entity).toBeInstanceOf(SpellListEntity);
  });

  it('should accept field assignments', () => {
    const entity = new SpellListEntity();
    entity.name = 'Wizard';
    entity.link = '/en/library/classes/wizard';

    expect(entity.name).toBe('Wizard');
    expect(entity.link).toBe('/en/library/classes/wizard');
  });
});

describe('SpellComponentEmbed', () => {
  it('should be constructable with undefined fields', () => {
    const embed = new SpellComponentEmbed();
    expect(embed.verbal).toBeUndefined();
    expect(embed.somatic).toBeUndefined();
    expect(embed.material).toBeUndefined();
    expect(embed.materialDescription).toBeUndefined();
  });
});
