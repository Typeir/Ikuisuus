/**
 * @fileoverview Unit tests for resolveStreamText.
 * @description Mocks the six repository adapters and fnv1a32. Asserts domain
 * fields appear in the output and that the string is doubled for the CSS loop.
 *
 * @module tests/unit/src/lib/machineText/index
 * @version 1.0.0
 * @author Typeir
 * @since 2026-04-28
 *
 * @requires vitest - Test framework
 * @requires @/lib/machineText - Module under test
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/repositories/monsterRepository', () => ({
  monsterRepository: { list: vi.fn(), listIndex: vi.fn(), getBySlug: vi.fn() },
}));
vi.mock('@/lib/db/content/repositories/spellRepository', () => ({
  spellRepository: { list: vi.fn(), listIndex: vi.fn(), getBySlug: vi.fn() },
}));
vi.mock('@/lib/db/content/repositories/heirloomRepository', () => ({
  heirloomRepository: { list: vi.fn(), listIndex: vi.fn(), getBySlug: vi.fn() },
}));
vi.mock('@/lib/db/content/repositories/trinketRepository', () => ({
  trinketRepository: { list: vi.fn(), listIndex: vi.fn(), getBySlug: vi.fn() },
}));
vi.mock('@/lib/db/content/repositories/bloodlineRepository', () => ({
  bloodlineRepository: {
    list: vi.fn(),
    listIndex: vi.fn(),
    getBySlug: vi.fn(),
  },
}));
vi.mock('@/lib/db/content/repositories/vocationRepository', () => ({
  vocationRepository: { list: vi.fn(), listIndex: vi.fn(), getBySlug: vi.fn() },
}));
vi.mock('@/lib/metadata', () => ({
  fnv1a32: vi.fn(() => 'deadbeef'),
}));

import { bloodlineRepository } from '@/lib/db/content/repositories/bloodlineRepository';
import { heirloomRepository } from '@/lib/db/content/repositories/heirloomRepository';
import { monsterRepository } from '@/lib/db/content/repositories/monsterRepository';
import { spellRepository } from '@/lib/db/content/repositories/spellRepository';
import { trinketRepository } from '@/lib/db/content/repositories/trinketRepository';
import { vocationRepository } from '@/lib/db/content/repositories/vocationRepository';
import { resolveStreamText } from '@/lib/machineText';

afterEach(() => {
  vi.clearAllMocks();
});

describe('resolveStreamText', () => {
  describe('monsters', () => {
    beforeEach(() => {
      vi.mocked(monsterRepository.getBySlug).mockResolvedValue({
        slug: 'wraithwarden',
        subSlug: undefined,
        cr: '14',
        size: 'large',
        creatureType: 'undead',
        hp: { average: 168 },
      } as never);
    });

    it('includes CR, SIZE, and creature type from the record', async () => {
      const result = await resolveStreamText(
        'en',
        ['monsters', 'wraithwarden'],
        '',
      );
      expect(result).toContain('CR:14');
      expect(result).toContain('LARGE');
      expect(result).toContain('UNDEAD');
      expect(result).toContain('HP:168');
    });

    it('returns a doubled string for seamless CSS loop', async () => {
      const result = await resolveStreamText(
        'en',
        ['monsters', 'wraithwarden'],
        '',
      );
      const half = result.slice(0, Math.floor(result.length / 2)).trim();
      const second = result.slice(Math.floor(result.length / 2)).trim();
      expect(half).toBe(second);
    });
  });

  describe('spells', () => {
    beforeEach(() => {
      vi.mocked(spellRepository.getBySlug).mockResolvedValue({
        slug: 'arcane-bolt',
        level: 3,
        school: 'evocation',
        castingTimeRaw: '1 action',
      } as never);
    });

    it('includes level, school, and casting time', async () => {
      const result = await resolveStreamText(
        'en',
        ['spells', 'arcane-bolt'],
        '',
      );
      expect(result).toContain('LV:3');
      expect(result).toContain('EVOCATION');
      expect(result).toContain('1 action');
    });
  });

  describe('items / heirlooms', () => {
    beforeEach(() => {
      vi.mocked(heirloomRepository.getBySlug).mockResolvedValue({
        slug: 'bonereaver',
        rarity: 'legendary',
        itemType: 'weapon',
        weaponType: 'Greatsword',
      } as never);
    });

    it('includes rarity, item type, and weapon type', async () => {
      const result = await resolveStreamText(
        'en',
        ['items', 'heirlooms', 'bonereaver'],
        '',
      );
      expect(result).toContain('LEGENDARY');
      expect(result).toContain('WEAPON');
      expect(result).toContain('Greatsword');
    });
  });

  describe('items / trinkets', () => {
    beforeEach(() => {
      vi.mocked(trinketRepository.getBySlug).mockResolvedValue({
        slug: 'ashvial',
        itemType: 'potion',
        damage: '2d6',
        damageType: 'fire',
      } as never);
    });

    it('includes item type and damage', async () => {
      const result = await resolveStreamText(
        'en',
        ['items', 'trinkets', 'ashvial'],
        '',
      );
      expect(result).toContain('POTION');
      expect(result).toContain('2d6 fire');
    });
  });

  describe('bloodlines', () => {
    beforeEach(() => {
      vi.mocked(bloodlineRepository.getBySlug).mockResolvedValue({
        slug: 'empyrean',
        coreFeatures: { creatureTypes: ['Humanoid', 'Celestial'] },
        boonBudget: 24,
      } as never);
    });

    it('includes creature types and boon budget', async () => {
      const result = await resolveStreamText(
        'en',
        ['bloodlines', 'empyrean'],
        '',
      );
      expect(result).toContain('HUMANOID/CELESTIAL');
      expect(result).toContain('BP:24');
    });
  });

  describe('vocations', () => {
    beforeEach(() => {
      vi.mocked(vocationRepository.getBySlug).mockResolvedValue({
        slug: 'warden',
        hitDie: 'd10',
      } as never);
    });

    it('includes VOCATION label and hit die', async () => {
      const result = await resolveStreamText('en', ['vocations', 'warden'], '');
      expect(result).toContain('VOCATION');
      expect(result).toContain('HD:d10');
    });
  });

  describe('fallback', () => {
    it('uses fnv1a32 hash when no repository matches', async () => {
      const result = await resolveStreamText(
        'en',
        ['world', 'some-article'],
        'raw',
      );
      expect(result).toContain('SIG:deadbeef');
    });

    it('falls back to hash when repository throws', async () => {
      vi.mocked(monsterRepository.getBySlug).mockRejectedValue(
        new Error('DB down'),
      );
      const result = await resolveStreamText(
        'en',
        ['monsters', 'anything'],
        'raw',
      );
      expect(result).toContain('SIG:deadbeef');
    });

    it('falls back to hash when repository returns null', async () => {
      vi.mocked(spellRepository.getBySlug).mockResolvedValue(null as never);
      const result = await resolveStreamText(
        'en',
        ['spells', 'unknown'],
        'raw',
      );
      expect(result).toContain('SIG:deadbeef');
    });
  });
});
