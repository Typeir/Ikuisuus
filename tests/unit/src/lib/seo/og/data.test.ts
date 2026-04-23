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

vi.mock('@/lib/db/content/adapters/fs/readMetadataFiles', () => ({
  readMetadataFiles: vi.fn(),
}));

import { readMetadataFiles } from '@/lib/db/content/adapters/fs/readMetadataFiles';

const mockRead = vi.mocked(readMetadataFiles);

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
  it('returns null for unsupported type', () => {
    mockRead.mockReturnValue([]);
    expect(getOgCardData('unknown-type', 'foo')).toBeNull();
  });

  it('returns null when slug is not found in metadata', () => {
    mockRead.mockReturnValue([{ slug: 'other-monster', title: 'Other' }]);
    expect(getOgCardData('monsters', 'abominable-avian')).toBeNull();
  });

  it('returns card data with correct fields for a monster', () => {
    mockRead.mockReturnValue([
      {
        slug: 'abominable-avian',
        title: 'Abominable Avian',
        creatureType: 'beast',
        size: 'large',
      },
    ]);

    const result = getOgCardData('monsters', 'abominable-avian');
    expect(result).not.toBeNull();
    expect(result?.title).toBe('Abominable Avian');
    expect(result?.creatureType).toBe('beast');
    expect(result?.rarity).toBeUndefined();
  });

  it('returns card data with rarity and itemType for heirlooms', () => {
    mockRead.mockReturnValue([
      {
        slug: 'dreaded-defender',
        title: 'Dreaded Defender',
        rarity: 'rare',
        itemType: 'weapon',
      },
    ]);

    const result = getOgCardData('heirlooms', 'dreaded-defender');
    expect(result?.rarity).toBe('rare');
    expect(result?.itemType).toBe('weapon');
  });

  it('formats cantrip level as "Cantrip"', () => {
    mockRead.mockReturnValue([
      { slug: 'fire-bolt', title: 'Fire Bolt', level: 0, school: 'Evocation' },
    ]);

    const result = getOgCardData('spells', 'fire-bolt');
    expect(result?.level).toBe('Cantrip');
  });

  it('formats numbered level correctly', () => {
    mockRead.mockReturnValue([
      { slug: 'fireball', title: 'Fireball', level: 3, school: 'Evocation' },
    ]);

    const result = getOgCardData('spells', 'fireball');
    expect(result?.level).toBe('Level 3');
  });
});
