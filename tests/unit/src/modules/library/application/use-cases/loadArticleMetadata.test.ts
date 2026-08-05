/**
 * @fileoverview Article Metadata Loader Tests
 * @description Covers resolving generated metadata for a route, and the failure
 * paths that must degrade to no aspects rather than to a broken page.
 *
 * @module tests/unit/src/modules/library/application/use-cases/loadArticleMetadata
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-04
 *
 * @requires vitest Testing framework
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const getBySlug = vi.fn();
const getSpellBySlug = vi.fn();
const getSpecializationBySlug = vi.fn();

/**
 * Every kind the loader can reach is stubbed. Leaving one live let the real
 * filesystem adapter answer a route the test believed was unresolvable, which
 * made the assertion depend on whether a spell of that slug happened to exist.
 */
vi.mock('@/lib/db/content/repositories/monsterRepository', () => ({
  monsterRepository: { getBySlug: (...a: unknown[]) => getBySlug(...a) },
}));

vi.mock('@/lib/db/content/repositories/spellRepository', () => ({
  spellRepository: { getBySlug: (...a: unknown[]) => getSpellBySlug(...a) },
}));

vi.mock('@/lib/db/content/repositories/heirloomRepository', () => ({
  heirloomRepository: { getBySlug: vi.fn().mockResolvedValue(null) },
}));

vi.mock('@/lib/db/content/repositories/trinketRepository', () => ({
  trinketRepository: { getBySlug: vi.fn().mockResolvedValue(null) },
}));

vi.mock('@/lib/db/content/repositories/featRepository', () => ({
  featRepository: { getBySlug: vi.fn().mockResolvedValue(null) },
}));

vi.mock('@/lib/db/content/repositories/bloodlineRepository', () => ({
  bloodlineRepository: { getBySlug: vi.fn().mockResolvedValue(null) },
}));

vi.mock('@/lib/db/content/repositories/vocationRepository', () => ({
  vocationRepository: { getBySlug: vi.fn().mockResolvedValue(null) },
}));

vi.mock('@/lib/db/content/repositories/specializationRepository', () => ({
  specializationRepository: {
    getBySlug: (...a: unknown[]) => getSpecializationBySlug(...a),
  },
}));

import {
  aspectSectionsOf,
  loadArticleMetadata,
} from '@/modules/library/application/use-cases/loadArticleMetadata';

beforeEach(() => {
  getBySlug.mockReset();
  getSpellBySlug.mockReset();
  getSpecializationBySlug.mockReset();
});

describe('loadArticleMetadata', () => {
  /**
   * Every kind carries aspects, so every kind resolves. Loading only monsters
   * left seven kinds with aspects in metadata and nothing on the page.
   */
  it('should resolve a kind that has no sections', async () => {
    getSpellBySlug.mockResolvedValue({
      slug: 'acid-splash',
      title: 'Acid Splash',
      tags: ['damage:chemical'],
    });

    const metadata = await loadArticleMetadata(['spells', 'acid-splash'], 'en');

    expect(metadata).toEqual({
      title: 'Acid Splash',
      contentType: 'spells',
      tags: ['damage:chemical'],
      sections: [],
    });
    expect(getBySlug).not.toHaveBeenCalled();
  });

  /** A vocation's own page and its specializations share a path prefix. */
  it('should read the trailing segment to tell a specialization from its vocation', async () => {
    getSpecializationBySlug.mockResolvedValue({
      slug: 'oath-of-devotion',
      title: 'Oath of Devotion',
      tags: ['vocation:paladin'],
      features: [{ name: 'Sacred Weapon', tags: ['damage:holy'] }],
    });

    const metadata = await loadArticleMetadata(
      ['character-creation', 'vocations', 'paladin', 'oath-of-devotion'],
      'en',
    );

    expect(getSpecializationBySlug).toHaveBeenCalledWith('en', 'oath-of-devotion');
    expect(metadata?.contentType).toBe('specializations');
    expect(metadata?.sections).toEqual([
      { name: 'Sacred Weapon', tags: ['damage:holy'] },
    ]);
  });

  it('should return null for a bare kind with no slug', async () => {
    expect(await loadArticleMetadata(['monsters'], 'en')).toBeNull();
  });

  it('should return null when the monster is unknown', async () => {
    getBySlug.mockResolvedValue(null);

    expect(await loadArticleMetadata(['monsters', 'nobody'], 'en')).toBeNull();
  });

  /** A metadata backend failure costs the page its aspects, not its content. */
  it('should return null when the repository throws', async () => {
    getBySlug.mockRejectedValue(new Error('backend down'));

    expect(await loadArticleMetadata(['monsters', 'mucklord'], 'en')).toBeNull();
  });

  it('should map a monster into the article shape', async () => {
    getBySlug.mockResolvedValue({
      slug: 'mucklord',
      title: 'Mucklord',
      tags: ['creature:construct'],
      features: [
        { id: 'a', name: 'Garbage Communion', tags: ['resource:temp-hp'] },
        { id: 'b', name: 'Detect' },
      ],
    });

    const metadata = await loadArticleMetadata(['monsters', 'mucklord'], 'en');

    expect(metadata).toEqual({
      title: 'Mucklord',
      contentType: 'monsters',
      tags: ['creature:construct'],
      sections: [
        { name: 'Garbage Communion', tags: ['resource:temp-hp'] },
        { name: 'Detect', tags: undefined },
      ],
    });
  });

  /**
   * Monster features have no pg representation yet, so production returns a
   * record with no `features` at all.
   */
  it('should map a monster whose backend returns no features', async () => {
    getBySlug.mockResolvedValue({
      slug: 'mucklord',
      title: 'Mucklord',
      tags: ['creature:construct'],
    });

    const metadata = await loadArticleMetadata(['monsters', 'mucklord'], 'en');

    expect(metadata?.sections).toEqual([]);
    expect(metadata?.tags).toEqual(['creature:construct']);
  });
});

describe('aspectSectionsOf', () => {
  it('should return nothing for a null record', () => {
    expect(aspectSectionsOf(null)).toEqual([]);
  });

  it('should list only sections that carry aspects', () => {
    expect(
      aspectSectionsOf({
        sections: [
          { name: 'Has', tags: ['damage:fire'] },
          { name: 'HasNot' },
          { name: 'Empty', tags: [] },
        ],
      }),
    ).toEqual(['Has']);
  });

  it('should include the title when the page itself has aspects', () => {
    expect(
      aspectSectionsOf({ title: 'Mucklord', tags: ['creature:construct'] }),
    ).toEqual(['Mucklord']);
  });

  it('should omit the title when the page has no aspects', () => {
    expect(aspectSectionsOf({ title: 'Mucklord', tags: [] })).toEqual([]);
  });
});
