/**
 * @fileoverview FeatEntity Unit Tests
 * @description Verifies that `FeatEntity` and `FeatAbilityIncreaseEmbed` have
 * the expected shape and are importable without side-effects.
 *
 * @module tests/unit/lib/db/orm/entities/FeatEntity
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
  FeatAbilityIncreaseEmbed,
  FeatEntity,
} from '@/lib/db/orm/entities/FeatEntity';
import { describe, expect, it } from 'vitest';

describe('FeatEntity', () => {
  it('can be instantiated with default values', () => {
    const entity = new FeatEntity();
    expect(Array.isArray(entity.tags)).toBe(true);
  });

  it('defaults tags to an empty array', () => {
    const entity = new FeatEntity();
    expect(entity.tags).toEqual([]);
  });
});

describe('FeatAbilityIncreaseEmbed', () => {
  it('can be instantiated without errors', () => {
    const embed = new FeatAbilityIncreaseEmbed();
    expect(embed).toBeDefined();
  });

  it('exposes optional amount and maximum', () => {
    const embed = new FeatAbilityIncreaseEmbed();
    embed.amount = 1;
    embed.maximum = 20;
    expect(embed.amount).toBe(1);
    expect(embed.maximum).toBe(20);
  });
});
