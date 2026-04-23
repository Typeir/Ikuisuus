/**
 * @fileoverview Unit tests for OG image metadata resolver.
 *
 * Validates type→subdir mapping, slug resolution, and null-safety for missing
 * records. Uses vi.mock to avoid touching the real filesystem.
 *
 * @module tests/unit/src/lib/seo/og/data.test
 */

import {
    getOgCardData,
    getSupportedOgTypes,
    resolveOgBackgroundImagePath,
    resolveOgImagePath,
} from '@/lib/seo/og/data';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/repositories', () => ({
  monsterRepository: { getBySlug: vi.fn() },
  heirloomRepository: { getBySlug: vi.fn() },
  spellRepository: { getBySlug: vi.fn() },
  trinketRepository: { getBySlug: vi.fn() },
  bloodlineRepository: { getBySlug: vi.fn() },
  vocationRepository: { getBySlug: vi.fn() },
  specializationRepository: { getBySlug: vi.fn() },
}));

import {
    heirloomRepository,
    monsterRepository,
    spellRepository,
} from '@/lib/db/content/repositories';

const mockMonster = vi.mocked(monsterRepository.getBySlug);
const mockHeirloom = vi.mocked(heirloomRepository.getBySlug);
const mockSpell = vi.mocked(spellRepository.getBySlug);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getSupportedOgTypes', () => {
  it('includes all primary content types', () => {
    const types = getSupportedOgTypes();
    expect(types).toContain('monsters');
    expect(types).toContain('heirlooms');
    expect(types).toContain('spells');
    expect(types).toContain('trinkets');
  });
});

describe('resolveOgImagePath', () => {
  it('resolves monster image path', () => {
    expect(resolveOgImagePath('monsters', 'abominable-avian')).toBe(
      '/library/images/monsters/abominable-avian.webp',
    );
  });

  it('resolves heirloom image path', () => {
    expect(resolveOgImagePath('heirlooms', 'dreaded-defender')).toBe(
      '/library/images/heirlooms/dreaded-defender.webp',
    );
  });

  it('returns empty string for unsupported type', () => {
    expect(resolveOgImagePath('vocations', 'revenant')).toBe('');
  });
});

describe('resolveOgBackgroundImagePath', () => {
  it('resolves monster background path', () => {
    expect(resolveOgBackgroundImagePath('monsters', 'abominable-avian')).toBe(
      '/library/images/monsters/abominable-avian-background.webp',
    );
  });

  it('resolves heirloom background path', () => {
    expect(resolveOgBackgroundImagePath('heirlooms', 'dreaded-defender')).toBe(
      '/library/images/heirlooms/dreaded-defender-background.webp',
    );
  });

  it('returns empty string for types without background images', () => {
    expect(resolveOgBackgroundImagePath('vocations', 'revenant')).toBe('');
  });
});

describe('getOgCardData', () => {
  it('returns null for unsupported type', async () => {
    expect(await getOgCardData('unknown-type', 'foo')).toBeNull();
  });

  it('returns null when slug is not found in metadata', async () => {
    mockMonster.mockResolvedValue(null);
    expect(await getOgCardData('monsters', 'abominable-avian')).toBeNull();
  });

  it('returns card data with correct fields for a monster', async () => {
    mockMonster.mockResolvedValue({
      slug: 'abominable-avian',
      title: 'Abominable Avian',
      file: 'monsters/abominable-avian.sheet.mdx',
      link: '/library/monsters/abominable-avian',
      creatureType: 'beast',
    });

    const result = await getOgCardData('monsters', 'abominable-avian');
    expect(result).not.toBeNull();
    expect(result?.title).toBe('Abominable Avian');
    expect(result?.creatureType).toBe('beast');
    expect(result?.rarity).toBeUndefined();
  });

  it('returns card data with rarity and itemType for heirlooms', async () => {
    mockHeirloom.mockResolvedValue({
      slug: 'dreaded-defender',
      title: 'Dreaded Defender',
      file: 'items/heirlooms/dreaded-defender.mdx',
      link: '/library/items/heirlooms/dreaded-defender',
      itemType: 'weapon',
      rarity: 'rare',
    });

    const result = await getOgCardData('heirlooms', 'dreaded-defender');
    expect(result?.rarity).toBe('rare');
    expect(result?.itemType).toBe('weapon');
  });

  it('formats cantrip level as "Cantrip"', async () => {
    mockSpell.mockResolvedValue({
      slug: 'fire-bolt',
      title: 'Fire Bolt',
      file: 'spells/fire-bolt.mdx',
      link: '/library/spells/fire-bolt',
      level: 0,
      school: 'Evocation',
    });

    const result = await getOgCardData('spells', 'fire-bolt');
    expect(result?.level).toBe('Cantrip');
  });

  it('formats numbered level correctly', async () => {
    mockSpell.mockResolvedValue({
      slug: 'fireball',
      title: 'Fireball',
      file: 'spells/fireball.mdx',
      link: '/library/spells/fireball',
      level: 3,
      school: 'Evocation',
    });

    const result = await getOgCardData('spells', 'fireball');
    expect(result?.level).toBe('Level 3');
  });
});
