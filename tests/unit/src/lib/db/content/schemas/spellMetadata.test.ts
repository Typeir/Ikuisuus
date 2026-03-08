/**
 * Spell Metadata Schema Unit Tests
 *
 * @fileoverview Tests for the spell metadata domain schema type exports.
 *
 * @module tests/unit/lib/db/content/schemas/spellMetadata
 */

import type {
    SpellIndexEntry,
    SpellListRef,
    SpellMetadata,
} from '@/lib/db/content/schemas/spellMetadata';
import { describe, expect, it } from 'vitest';

describe('SpellMetadata Schema', () => {
  it('should accept a valid SpellMetadata object', () => {
    const spell: SpellMetadata = {
      slug: 'fireball',
      title: 'Fireball',
      file: 'src/content/en/spells/fireball.mdx',
      link: '/library/spells/fireball',
      level: 3,
      school: 'Evocation',
      concentration: false,
      tags: ['fire', 'aoe'],
    };

    expect(spell.slug).toBe('fireball');
    expect(spell.level).toBe(3);
    expect(spell.school).toBe('Evocation');
  });

  it('should accept a minimal SpellMetadata with only required fields', () => {
    const minimal: SpellMetadata = {
      slug: 'light',
      title: 'Light',
      file: 'light.mdx',
      link: '/library/spells/light',
    };

    expect(minimal.slug).toBe('light');
    expect(minimal.level).toBeUndefined();
  });

  it('should accept a SpellListRef object', () => {
    const ref: SpellListRef = {
      name: 'Revenant',
      link: '/library/classes/revenant/spell-list',
    };

    expect(ref.name).toBe('Revenant');
    expect(ref.link).toContain('revenant');
  });

  it('should accept a SpellIndexEntry object', () => {
    const entry: SpellIndexEntry = {
      slug: 'fireball',
      title: 'Fireball',
      level: 3,
      school: 'Evocation',
    };

    expect(entry.slug).toBe('fireball');
    expect(entry.level).toBe(3);
  });

  it('should support external spell fields', () => {
    const external: SpellMetadata = {
      slug: 'shield',
      title: 'Shield',
      file: 'external',
      link: 'https://www.dndbeyond.com/spells/shield',
      level: 1,
      school: 'Abjuration',
      hasRitual: false,
      castingTimeRaw: '1 reaction',
      castingTime: ['reaction'],
      range: 'Self',
      concentration: false,
      duration: 'Instantaneous',
      verbal: true,
      somatic: true,
      material: false,
      spellLists: [{ name: 'Wizard', link: '/library/classes/wizard' }],
    };

    expect(external.file).toBe('external');
    expect(external.hasRitual).toBe(false);
    expect(external.spellLists).toHaveLength(1);
  });

  it('should accept cantrips with level 0', () => {
    const cantrip: SpellMetadata = {
      slug: 'fire-bolt',
      title: 'Fire Bolt',
      file: 'fire-bolt.mdx',
      link: '/library/spells/fire-bolt',
      level: 0,
      school: 'Evocation',
    };

    expect(cantrip.level).toBe(0);
  });
});
