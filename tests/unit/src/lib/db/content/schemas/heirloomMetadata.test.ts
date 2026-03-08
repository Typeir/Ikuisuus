/**
 * Heirloom Metadata Schema Unit Tests
 *
 * @fileoverview Tests for the heirloom metadata domain schema type exports.
 * Validates that all expected types and interfaces are exported and usable.
 *
 * @module tests/unit/lib/db/content/schemas/heirloomMetadata
 */

import type {
    HeirloomIndexEntry,
    HeirloomMetadata,
    HeirloomWeaponDamage,
} from '@/lib/db/content/schemas/heirloomMetadata';
import { describe, expect, it } from 'vitest';

describe('HeirloomMetadata Schema', () => {
  it('should accept a valid HeirloomMetadata object', () => {
    const heirloom: HeirloomMetadata = {
      slug: 'flame-tongue',
      title: 'Flame Tongue',
      file: 'src/content/en/items/heirlooms/flame-tongue.mdx',
      link: '/library/items/heirlooms/flame-tongue',
      rarity: 'rare',
      itemType: 'weapon',
      weaponType: 'longsword',
      requiresAttunement: true,
      tags: ['fire', 'martial'],
    };

    expect(heirloom.slug).toBe('flame-tongue');
    expect(heirloom.title).toBe('Flame Tongue');
    expect(heirloom.rarity).toBe('rare');
    expect(heirloom.requiresAttunement).toBe(true);
    expect(heirloom.tags).toEqual(['fire', 'martial']);
  });

  it('should accept a minimal HeirloomMetadata with only required fields', () => {
    const minimal: HeirloomMetadata = {
      slug: 'basic-ring',
      title: 'Basic Ring',
      file: 'basic-ring.mdx',
      link: '/library/items/heirlooms/basic-ring',
    };

    expect(minimal.slug).toBe('basic-ring');
    expect(minimal.rarity).toBeUndefined();
    expect(minimal.weaponDamage).toBeUndefined();
  });

  it('should accept a HeirloomWeaponDamage object', () => {
    const damage: HeirloomWeaponDamage = {
      damage: '1d10',
      damageType: 'slashing',
      versatileDamage: '1d12',
    };

    expect(damage.damage).toBe('1d10');
    expect(damage.damageType).toBe('slashing');
    expect(damage.versatileDamage).toBe('1d12');
  });

  it('should accept a HeirloomIndexEntry object', () => {
    const entry: HeirloomIndexEntry = {
      slug: 'flame-tongue',
      title: 'Flame Tongue',
      rarity: 'rare',
      itemType: 'weapon',
      requiresAttunement: true,
    };

    expect(entry.slug).toBe('flame-tongue');
    expect(entry.title).toBe('Flame Tongue');
  });

  it('should support all optional fields on HeirloomMetadata', () => {
    const full: HeirloomMetadata = {
      slug: 'full-heirloom',
      title: 'Full Heirloom',
      file: 'full-heirloom.mdx',
      link: '/library/items/heirlooms/full-heirloom',
      rarity: 'legendary',
      itemType: 'weapon',
      weaponType: 'greatsword',
      requiresAttunement: true,
      attunementRequirements: 'by a paladin',
      weaponProperties: ['heavy', 'two-handed'],
      mastery: ['graze'],
      weaponDamage: { damage: '2d6', damageType: 'slashing' },
      hitModifier: 3,
      range: '5 ft.',
      weight: '6 lbs',
      damageTypesDealt: ['slashing', 'radiant'],
      savingThrowTypes: ['wisdom'],
      charges: 5,
      tags: ['radiant', 'paladin'],
      indexVersion: 1,
    };

    expect(full.hitModifier).toBe(3);
    expect(full.charges).toBe(5);
    expect(full.weaponProperties).toHaveLength(2);
    expect(full.mastery).toEqual(['graze']);
  });
});
