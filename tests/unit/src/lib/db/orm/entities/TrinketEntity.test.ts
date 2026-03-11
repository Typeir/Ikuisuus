/**
 * TrinketEntity Unit Tests
 *
 * @fileoverview Tests for the Trinket MikroORM entity and
 * the TrinketSavingThrowEmbed value object.
 *
 * @module tests/unit/lib/db/orm/entities/TrinketEntity
 */

import {
    TrinketEntity,
    TrinketSavingThrowEmbed,
} from '@/lib/db/orm/entities/TrinketEntity';
import { describe, expect, it } from 'vitest';

describe('TrinketEntity', () => {
  it('should be constructable with embedded default', () => {
    const entity = new TrinketEntity();

    expect(entity).toBeInstanceOf(TrinketEntity);
    expect(entity.savingThrow).toBeInstanceOf(TrinketSavingThrowEmbed);
  });

  it('should initialise array fields as empty arrays', () => {
    const entity = new TrinketEntity();
    expect(entity.properties).toEqual([]);
    expect(entity.specialEffects).toEqual([]);
    expect(entity.inflictsConditions).toEqual([]);
    expect(entity.tags).toEqual([]);
  });

  it('should accept scalar field assignments', () => {
    const entity = new TrinketEntity();
    entity.locale = 'en';
    entity.slug = 'alchemists-fire';
    entity.title = "Alchemist's Fire";
    entity.file = 'alchemists-fire.mdx';
    entity.link = '/en/library/trinkets/alchemists-fire';
    entity.itemType = 'Adventuring Gear';

    expect(entity.slug).toBe('alchemists-fire');
    expect(entity.itemType).toBe('Adventuring Gear');
  });
});

describe('TrinketSavingThrowEmbed', () => {
  it('should be constructable with undefined fields', () => {
    const embed = new TrinketSavingThrowEmbed();
    expect(embed.dc).toBeUndefined();
    expect(embed.ability).toBeUndefined();
  });
});
