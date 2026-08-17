/**
 * @fileoverview Ability Import Helpers Tests
 * @description Unit tests for the metadata → CharacterAbility mappers and the
 * raw-source fetch helper used by the Abilities tab import panel.
 *
 * @module tests/unit/src/modules/character-builder/presentation/tabs/abilities/importHelpers
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { FeatMetadata } from '@/lib/db/content/schemas/featMetadata';
import type { HeirloomMetadata } from '@/lib/db/content/schemas/heirloomMetadata';
import type { SpellMetadata } from '@/lib/db/content/schemas/spellMetadata';
import type { TrinketMetadata } from '@/lib/db/content/schemas/trinketMetadata';
import {
    featToAbility,
    fetchRawSource,
    heirloomToAbility,
    spellToAbility,
    trinketToAbility,
} from '@/modules/character-builder/presentation/tabs/abilities/importHelpers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetch = vi.fn();

describe('importHelpers', () => {
  describe('spellToAbility', () => {
    it('maps identity fields and marks provenance', () => {
      const spell = {
        title: 'Fireball',
        slug: 'fireball',
        level: 3,
        school: 'Evocation',
        description: 'A bright streak.',
      } as SpellMetadata;

      const ability = spellToAbility(spell);

      expect(ability.name).toBe('Fireball');
      expect(ability.type).toBe('Spell');
      expect(ability.source).toBe('fireball');
      expect(ability.importedFrom).toBe('spells');
      expect(ability.description).toBe('A bright streak.');
      expect(ability.id).toBeTruthy();
    });

    it('renders a blockquote mechanics block with the level line', () => {
      const spell = {
        title: 'Fireball',
        slug: 'fireball',
        level: 3,
        school: 'Evocation',
        range: '150 feet',
        duration: 'Instantaneous',
      } as SpellMetadata;

      const { mechanics } = spellToAbility(spell);

      expect(mechanics).toContain('> **Fireball**');
      expect(mechanics).toContain('3rd-level');
      expect(mechanics).toContain('3rd-level Spell');
      expect(mechanics).not.toContain('Evocation');
      expect(mechanics).toContain('> **Range**: 150 feet');
      expect(mechanics).toContain('> **Duration**: Instantaneous');
    });

    it('labels level 0 spells as cantrips', () => {
      const spell = {
        title: 'Light',
        slug: 'light',
        level: 0,
      } as SpellMetadata;
      expect(spellToAbility(spell).mechanics).toContain('Cantrip');
    });

    it('uses correct ordinal suffixes for low levels', () => {
      const at = (level: number) =>
        spellToAbility({ title: 'S', slug: 's', level } as SpellMetadata)
          .mechanics;
      expect(at(1)).toContain('1st-level');
      expect(at(2)).toContain('2nd-level');
      expect(at(3)).toContain('3rd-level');
      expect(at(4)).toContain('4th-level');
    });

    it('joins present components and omits absent ones', () => {
      const spell = {
        title: 'Shield',
        slug: 'shield',
        level: 1,
        components: {
          verbal: true,
          somatic: false,
          material: true,
          materialDescription: 'a twig',
        },
      } as SpellMetadata;

      const { mechanics } = spellToAbility(spell);

      expect(mechanics).toContain('> **Components**: V, M (a twig)');
      expect(mechanics).not.toContain('S,');
    });

    it('defaults a missing description to an empty string', () => {
      const spell = { title: 'Bare', slug: 'bare' } as SpellMetadata;
      expect(spellToAbility(spell).description).toBe('');
    });
  });

  describe('heirloomToAbility', () => {
    it('maps identity fields and provenance', () => {
      const item = {
        title: 'Sunblade',
        slug: 'sunblade',
        description: 'A radiant hilt.',
      } as HeirloomMetadata;

      const ability = heirloomToAbility(item);

      expect(ability.name).toBe('Sunblade');
      expect(ability.type).toBe('Heirloom');
      expect(ability.importedFrom).toBe('heirlooms');
      expect(ability.description).toBe('A radiant hilt.');
    });

    it('builds a mechanics block from the present stats', () => {
      const item = {
        title: 'Sunblade',
        slug: 'sunblade',
        rarity: 'Rare',
        requiresAttunement: true,
        weaponDamage: '1d8',
        weaponDamageType: 'radiant',
      } as HeirloomMetadata;

      const { mechanics } = heirloomToAbility(item);

      expect(mechanics).toContain('> **Sunblade**');
      expect(mechanics).toContain('> **Rarity**: Rare');
      expect(mechanics).toContain('> **Requires Attunement**');
      expect(mechanics).toContain('> **Damage**: 1d8 radiant');
    });

    it('returns empty mechanics when no stats are present', () => {
      const item = { title: 'Plain', slug: 'plain' } as HeirloomMetadata;
      expect(heirloomToAbility(item).mechanics).toBe('');
    });
  });

  describe('trinketToAbility', () => {
    it('maps identity fields and provenance', () => {
      const item = { title: 'Odd Cog', slug: 'odd-cog' } as TrinketMetadata;
      const ability = trinketToAbility(item);
      expect(ability.name).toBe('Odd Cog');
      expect(ability.type).toBe('Trinket');
      expect(ability.importedFrom).toBe('trinkets');
    });

    it('includes damage and weight when present', () => {
      const item = {
        title: 'Dart',
        slug: 'dart',
        damage: '1d4',
        damageType: 'piercing',
        weight: '0.25 lb',
      } as TrinketMetadata;

      const { mechanics } = trinketToAbility(item);

      expect(mechanics).toContain('> **Damage**: 1d4 piercing');
      expect(mechanics).toContain('> **Weight**: 0.25 lb');
    });
  });

  describe('featToAbility', () => {
    it('maps identity fields and provenance', () => {
      const feat = {
        title: 'Tough',
        slug: 'tough',
        description: 'Extra hit points.',
      } as FeatMetadata;

      const ability = featToAbility(feat);

      expect(ability.name).toBe('Tough');
      expect(ability.type).toBe('Feat');
      expect(ability.source).toBe('tough');
      expect(ability.importedFrom).toBe('feats');
      expect(ability.description).toBe('Extra hit points.');
    });

    it('renders the prerequisite as mechanics, or empty when absent', () => {
      const withPrereq = featToAbility({
        title: 'Grappler',
        slug: 'grappler',
        prerequisite: 'Strength 13',
      } as FeatMetadata);
      const without = featToAbility({
        title: 'Tough',
        slug: 'tough',
      } as FeatMetadata);

      expect(withPrereq.mechanics).toBe('**Prerequisite**: Strength 13');
      expect(without.mechanics).toBe('');
    });
  });

  describe('fetchRawSource', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', mockFetch);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.clearAllMocks();
    });

    it('posts the descriptor and returns the content field', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ content: '# Fireball' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const result = await fetchRawSource('spells', 'fireball', 'en');

      expect(result).toBe('# Fireball');
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/raw-content',
        expect.objectContaining({ method: 'POST' }),
      );
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body).toEqual({ type: 'spells', slug: 'fireball', locale: 'en' });
    });

    it('returns undefined on a non-ok response', async () => {
      mockFetch.mockResolvedValue(new Response('', { status: 404 }));
      await expect(fetchRawSource('spells', 'missing', 'en')).resolves.toBe(
        undefined,
      );
    });

    it('swallows network errors and returns undefined', async () => {
      mockFetch.mockRejectedValue(new Error('offline'));
      await expect(fetchRawSource('feats', 'tough', 'en')).resolves.toBe(
        undefined,
      );
    });
  });
});
