/**
 * Trinket Metadata Schema Unit Tests
 *
 * @fileoverview Tests for the trinket metadata domain schema type exports.
 *
 * @module tests/unit/lib/db/content/schemas/trinketMetadata
 */

import type {
    TrinketIndexEntry,
    TrinketMetadata,
} from '@/lib/db/content/schemas/trinketMetadata';
import { describe, expect, it } from 'vitest';

describe('TrinketMetadata Schema', () => {
  it('should accept a valid TrinketMetadata object', () => {
    const trinket: TrinketMetadata = {
      slug: 'bolas',
      title: 'Bolas',
      file: 'src/content/en/items/trinkets/bolas.mdx',
      link: '/library/items/trinkets/bolas',
      itemType: 'Adventuring Gear',
      damage: '1d6',
      damageType: 'bludgeoning',
      properties: ['thrown', 'special'],
      range: '30/60',
      weight: '1 lb.',
    };

    expect(trinket.slug).toBe('bolas');
    expect(trinket.itemType).toBe('Adventuring Gear');
    expect(trinket.damage).toBe('1d6');
  });

  it('should accept a minimal TrinketMetadata with only required fields', () => {
    const minimal: TrinketMetadata = {
      slug: 'torch',
      title: 'Torch',
      file: 'torch.mdx',
      link: '/library/items/trinkets/torch',
      itemType: 'Adventuring Gear',
    };

    expect(minimal.slug).toBe('torch');
    expect(minimal.damage).toBeUndefined();
    expect(minimal.range).toBeUndefined();
  });

  it('should accept a TrinketIndexEntry object', () => {
    const entry: TrinketIndexEntry = {
      slug: 'bolas',
      title: 'Bolas',
      itemType: 'Adventuring Gear',
      damage: '1d6',
      damageType: 'bludgeoning',
    };

    expect(entry.slug).toBe('bolas');
    expect(entry.itemType).toBe('Adventuring Gear');
  });

  it('should support trinkets with saving throws', () => {
    const trinket: TrinketMetadata = {
      slug: 'net',
      title: 'Net',
      file: 'net.mdx',
      link: '/library/items/trinkets/net',
      itemType: 'Adventuring Gear',
      savingThrowDC: 15,
      savingThrowAbility: 'dexterity',
      specialEffects: ['restrain'],
      inflictsConditions: ['restrained'],
    };

    expect(trinket.savingThrowDC).toBe(15);
    expect(trinket.inflictsConditions).toEqual(['restrained']);
  });

  it('should support tags on trinkets', () => {
    const trinket: TrinketMetadata = {
      slug: 'alchemists-fire',
      title: "Alchemist's Fire",
      file: 'alchemists-fire.mdx',
      link: '/library/items/trinkets/alchemists-fire',
      itemType: 'Adventuring Gear',
      tags: ['fire', 'thrown', 'consumable'],
    };

    expect(trinket.tags).toHaveLength(3);
    expect(trinket.tags).toContain('fire');
  });
});
