/**
 * MonsterEntity Unit Tests
 *
 * @fileoverview Tests for the Monster MikroORM entity and its embeddable VOs.
 *
 * @module tests/unit/lib/db/orm/entities/MonsterEntity
 */

import {
    MonsterACEmbed,
    MonsterEntity,
    MonsterHPEmbed,
    MonsterSaveEmbed,
    MonsterScoreEmbed,
    MonsterSenseEmbed,
    MonsterSpeedEmbed,
} from '@/lib/db/orm/entities/MonsterEntity';
import { describe, expect, it } from 'vitest';

describe('MonsterEntity', () => {
  it('should be constructable with embedded defaults', () => {
    const entity = new MonsterEntity();

    expect(entity).toBeInstanceOf(MonsterEntity);
    expect(entity.ac).toBeInstanceOf(MonsterACEmbed);
    expect(entity.hp).toBeInstanceOf(MonsterHPEmbed);
    expect(entity.speed).toBeInstanceOf(MonsterSpeedEmbed);
    expect(entity.scores).toBeInstanceOf(MonsterScoreEmbed);
    expect(entity.saves).toBeInstanceOf(MonsterSaveEmbed);
    expect(entity.senses).toBeInstanceOf(MonsterSenseEmbed);
  });

  it('should initialise array fields as empty arrays', () => {
    const entity = new MonsterEntity();

    expect(entity.skills).toEqual([]);
    expect(entity.damageResistances).toEqual([]);
    expect(entity.damageImmunities).toEqual([]);
    expect(entity.damageVulnerabilities).toEqual([]);
    expect(entity.conditionImmunities).toEqual([]);
    expect(entity.languages).toEqual([]);
    expect(entity.tags).toEqual([]);
  });

  it('should accept scalar field assignments', () => {
    const entity = new MonsterEntity();
    entity.locale = 'en';
    entity.slug = 'ancient-dragon';
    entity.title = 'Ancient Dragon';
    entity.file = 'ancient-dragon.sheet.mdx';
    entity.link = '/en/library/monsters/ancient-dragon';
    entity.size = 'Gargantuan';
    entity.creatureType = 'Dragon';
    entity.cr = '24';

    expect(entity.locale).toBe('en');
    expect(entity.slug).toBe('ancient-dragon');
    expect(entity.cr).toBe('24');
  });
});

describe('MonsterACEmbed', () => {
  it('should be constructable with undefined fields', () => {
    const embed = new MonsterACEmbed();
    expect(embed.value).toBeUndefined();
    expect(embed.notes).toBeUndefined();
    expect(embed.raw).toBeUndefined();
  });
});

describe('MonsterHPEmbed', () => {
  it('should be constructable with undefined fields', () => {
    const embed = new MonsterHPEmbed();
    expect(embed.average).toBeUndefined();
    expect(embed.formula).toBeUndefined();
    expect(embed.raw).toBeUndefined();
  });
});

describe('MonsterSpeedEmbed', () => {
  it('should be constructable with undefined fields', () => {
    const embed = new MonsterSpeedEmbed();
    expect(embed.raw).toBeUndefined();
    expect(embed.walk).toBeUndefined();
    expect(embed.fly).toBeUndefined();
    expect(embed.climb).toBeUndefined();
    expect(embed.swim).toBeUndefined();
    expect(embed.burrow).toBeUndefined();
    expect(embed.hover).toBeUndefined();
  });
});

describe('MonsterScoreEmbed', () => {
  it('should be constructable with undefined fields', () => {
    const embed = new MonsterScoreEmbed();
    expect(embed.str).toBeUndefined();
    expect(embed.dex).toBeUndefined();
    expect(embed.con).toBeUndefined();
    expect(embed.int).toBeUndefined();
    expect(embed.wis).toBeUndefined();
    expect(embed.cha).toBeUndefined();
  });
});

describe('MonsterSaveEmbed', () => {
  it('should be constructable with undefined fields', () => {
    const embed = new MonsterSaveEmbed();
    expect(embed.str).toBeUndefined();
    expect(embed.dex).toBeUndefined();
    expect(embed.con).toBeUndefined();
    expect(embed.int).toBeUndefined();
    expect(embed.wis).toBeUndefined();
    expect(embed.cha).toBeUndefined();
  });
});

describe('MonsterSenseEmbed', () => {
  it('should be constructable with undefined fields', () => {
    const embed = new MonsterSenseEmbed();
    expect(embed.raw).toBeUndefined();
    expect(embed.passivePerception).toBeUndefined();
    expect(embed.darkvision).toBeUndefined();
    expect(embed.blindsight).toBeUndefined();
    expect(embed.tremorsense).toBeUndefined();
    expect(embed.truesight).toBeUndefined();
  });
});
