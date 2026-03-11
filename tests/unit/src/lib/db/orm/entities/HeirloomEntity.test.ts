/**
 * HeirloomEntity Unit Tests
 *
 * @fileoverview Tests for the Heirloom MikroORM entity and
 * the HeirloomChargesEmbed value object.
 *
 * @module tests/unit/lib/db/orm/entities/HeirloomEntity
 */

import {
    HeirloomChargesEmbed,
    HeirloomEntity,
} from '@/lib/db/orm/entities/HeirloomEntity';
import { describe, expect, it } from 'vitest';

describe('HeirloomEntity', () => {
  it('should be constructable with embedded default', () => {
    const entity = new HeirloomEntity();

    expect(entity).toBeInstanceOf(HeirloomEntity);
    expect(entity.charges).toBeInstanceOf(HeirloomChargesEmbed);
  });

  it('should initialise array fields as empty arrays', () => {
    const entity = new HeirloomEntity();
    expect(entity.mastery).toEqual([]);
    expect(entity.weaponProperties).toEqual([]);
    expect(entity.damageTypesDealt).toEqual([]);
    expect(entity.savingThrowTypes).toEqual([]);
    expect(entity.tags).toEqual([]);
  });

  it('should accept scalar field assignments', () => {
    const entity = new HeirloomEntity();
    entity.locale = 'en';
    entity.slug = 'flame-tongue';
    entity.title = 'Flame Tongue';
    entity.file = 'flame-tongue.mdx';
    entity.link = '/en/library/heirlooms/flame-tongue';
    entity.rarity = 'Rare';
    entity.itemType = 'Weapon';

    expect(entity.slug).toBe('flame-tongue');
    expect(entity.rarity).toBe('Rare');
  });
});

describe('HeirloomChargesEmbed', () => {
  it('should be constructable with undefined fields', () => {
    const embed = new HeirloomChargesEmbed();
    expect(embed.initial).toBeUndefined();
    expect(embed.recharge).toBeUndefined();
    expect(embed.depletes).toBeUndefined();
  });
});
