/**
 * MonsterEmbeds Unit Tests
 *
 * @fileoverview Tests for the value objects embedded into the monsters table,
 * and for their continued re-export from MonsterEntity.
 *
 * @module tests/unit/src/lib/db/orm/entities/MonsterEmbeds.test
 */

import {
  MonsterACEmbed,
  MonsterHPEmbed,
  MonsterSaveEmbed,
  MonsterScoreEmbed,
  MonsterSenseEmbed,
  MonsterSpeedEmbed,
} from '@/lib/db/orm/entities/MonsterEmbeds';
import * as MonsterEntityModule from '@/lib/db/orm/entities/MonsterEntity';
import { describe, expect, it } from 'vitest';

describe('MonsterEmbeds', () => {
  it('should construct every embeddable', () => {
    expect(new MonsterACEmbed()).toBeInstanceOf(MonsterACEmbed);
    expect(new MonsterHPEmbed()).toBeInstanceOf(MonsterHPEmbed);
    expect(new MonsterSpeedEmbed()).toBeInstanceOf(MonsterSpeedEmbed);
    expect(new MonsterScoreEmbed()).toBeInstanceOf(MonsterScoreEmbed);
    expect(new MonsterSaveEmbed()).toBeInstanceOf(MonsterSaveEmbed);
    expect(new MonsterSenseEmbed()).toBeInstanceOf(MonsterSenseEmbed);
  });

  it('should accept armour class assignments', () => {
    const embed = new MonsterACEmbed();
    embed.value = 15;
    embed.notes = 'natural armour';

    expect(embed.value).toBe(15);
    expect(embed.notes).toBe('natural armour');
  });

  it('should accept hit point assignments', () => {
    const embed = new MonsterHPEmbed();
    embed.value = 82;

    expect(embed.value).toBe(82);
  });

  it('should accept ability score assignments', () => {
    const embed = new MonsterScoreEmbed();
    embed.str = 18;
    embed.dex = 12;

    expect(embed.str).toBe(18);
    expect(embed.dex).toBe(12);
  });

  it('should leave unassigned fields undefined', () => {
    expect(new MonsterSaveEmbed().str).toBeUndefined();
    expect(new MonsterSenseEmbed().darkvision).toBeUndefined();
  });

  it('should stay re-exported from MonsterEntity', () => {
    expect(MonsterEntityModule.MonsterACEmbed).toBe(MonsterACEmbed);
    expect(MonsterEntityModule.MonsterHPEmbed).toBe(MonsterHPEmbed);
    expect(MonsterEntityModule.MonsterSpeedEmbed).toBe(MonsterSpeedEmbed);
    expect(MonsterEntityModule.MonsterScoreEmbed).toBe(MonsterScoreEmbed);
    expect(MonsterEntityModule.MonsterSaveEmbed).toBe(MonsterSaveEmbed);
    expect(MonsterEntityModule.MonsterSenseEmbed).toBe(MonsterSenseEmbed);
  });
});
