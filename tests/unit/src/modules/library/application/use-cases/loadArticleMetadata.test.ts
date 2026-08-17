/**
 * @fileoverview Article Metadata Loader Tests
 * @description Tests `loadArticleMetadata` and `aspectIndexOf`.
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
const getAllBySlug = vi.fn();
const getSpellBySlug = vi.fn();
const getSpecializationBySlug = vi.fn();

/**
 * Stubs every repository the loader can reach. Monster, spell, and
 * specialization calls go through mock functions; the rest resolve null.
 */
vi.mock('@/lib/db/content/repositories/monsterRepository', () => ({
  monsterRepository: {
    getBySlug: (...a: unknown[]) => getBySlug(...a),
    getAllBySlug: (...a: unknown[]) => getAllBySlug(...a),
  },
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
  aspectIndexOf,
  loadArticleMetadata,
} from '@/modules/library/application/use-cases/loadArticleMetadata';

beforeEach(() => {
  getBySlug.mockReset();
  getAllBySlug.mockReset();
  getAllBySlug.mockResolvedValue([]);
  getSpellBySlug.mockReset();
  getSpecializationBySlug.mockReset();
});

describe('loadArticleMetadata', () => {
  /** A kind with no section aspects still resolves. */
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
      sections: [{ name: 'acid-splash', tags: ['damage:chemical'] }],
      records: ['acid-splash'],
    });
    expect(getBySlug).not.toHaveBeenCalled();
  });

  /** A specialization and its vocation share a path prefix; the trailing segment disambiguates. */
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
      { name: 'oath-of-devotion', tags: ['vocation:paladin'] },
      { name: 'oath-of-devotion/sacred-weapon', tags: ['damage:holy'] },
      { name: 'sacred-weapon', tags: ['damage:holy'] },
    ]);
  });

  it('should return null for a bare kind with no slug', async () => {
    expect(await loadArticleMetadata(['monsters'], 'en')).toBeNull();
  });

  it('should return null when the monster is unknown', async () => {
    getBySlug.mockResolvedValue(null);

    expect(await loadArticleMetadata(['monsters', 'nobody'], 'en')).toBeNull();
  });

  /** A repository rejection degrades to null. */
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
        { name: 'mucklord', tags: ['creature:construct'] },
        { name: 'mucklord/garbage-communion', tags: ['resource:temp-hp'] },
        { name: 'garbage-communion', tags: ['resource:temp-hp'] },
        { name: 'mucklord/detect', tags: [] },
        { name: 'detect', tags: [] },
      ],
      records: ['mucklord'],
    });
  });

  /** The repository may return a record with no `features` key. */
  it('should map a monster whose backend returns no features', async () => {
    getBySlug.mockResolvedValue({
      slug: 'mucklord',
      title: 'Mucklord',
      tags: ['creature:construct'],
    });

    const metadata = await loadArticleMetadata(['monsters', 'mucklord'], 'en');

    expect(metadata?.sections).toEqual([
      { name: 'mucklord', tags: ['creature:construct'] },
    ]);
    expect(metadata?.tags).toEqual(['creature:construct']);
  });

  it('should merge every stat block of a multi-sheet monster file', async () => {
    getAllBySlug.mockResolvedValue([
      {
        slug: 'hounds',
        subSlug: 'hound',
        title: 'Hound',
        tags: ['creature:beast'],
        features: [
          { id: 'a', name: 'Bite', tags: ['damage:piercing'] },
          { id: 'b', name: 'Keen Smell', tags: ['sense:smell'] },
        ],
      },
      {
        slug: 'hounds',
        subSlug: 'dire-hound',
        title: 'Dire Hound',
        tags: ['creature:beast', 'size:large'],
        features: [
          { id: 'c', name: 'Bite', tags: ['damage:piercing', 'condition:prone'] },
          { id: 'd', name: 'Howl', tags: ['condition:frightened'] },
        ],
      },
    ]);

    const metadata = await loadArticleMetadata(['monsters', 'hounds'], 'en');

    expect(getBySlug).not.toHaveBeenCalled();
    expect(metadata).toEqual({
      title: 'Hound',
      contentType: 'monsters',
      tags: ['creature:beast'],
      sections: [
        { name: 'hound', tags: ['creature:beast'] },
        { name: 'hound/bite', tags: ['damage:piercing'] },
        { name: 'bite', tags: ['damage:piercing', 'condition:prone'] },
        { name: 'hound/keen-smell', tags: ['sense:smell'] },
        { name: 'keen-smell', tags: ['sense:smell'] },
        { name: 'dire-hound', tags: ['creature:beast', 'size:large'] },
        { name: 'dire-hound/bite', tags: ['damage:piercing', 'condition:prone'] },
        { name: 'dire-hound/howl', tags: ['condition:frightened'] },
        { name: 'howl', tags: ['condition:frightened'] },
      ],
      records: ['hound', 'dire-hound'],
    });
  });

  it('should fall back to getBySlug for a subSlug route', async () => {
    getAllBySlug.mockResolvedValue([]);
    getBySlug.mockResolvedValue({
      slug: 'hounds',
      subSlug: 'dire-hound',
      title: 'Dire Hound',
      tags: ['creature:beast'],
      features: [{ id: 'd', name: 'Howl', tags: ['condition:frightened'] }],
    });

    const metadata = await loadArticleMetadata(
      ['monsters', 'dire-hound'],
      'en',
    );

    expect(getBySlug).toHaveBeenCalledWith('en', 'dire-hound');
    expect(metadata?.title).toBe('Dire Hound');
    expect(metadata?.sections).toEqual([
      { name: 'dire-hound', tags: ['creature:beast'] },
      { name: 'dire-hound/howl', tags: ['condition:frightened'] },
      { name: 'howl', tags: ['condition:frightened'] },
    ]);
  });

  it('should key a feature by both its heading and its name anchors', async () => {
    getSpecializationBySlug.mockResolvedValue({
      slug: 'evocation',
      title: 'Evocation',
      tags: [],
      features: [
        { name: 'Spellcasting', heading: '1st Level – Spellcasting', tags: ['mechanic:spellcasting'] },
      ],
    });

    const metadata = await loadArticleMetadata(
      ['character-creation', 'vocations', 'wizard', 'evocation'],
      'en',
    );

    expect(metadata?.sections?.map((s) => s.name)).toEqual([
      'evocation',
      'evocation/1st-level-spellcasting',
      '1st-level-spellcasting',
      'evocation/spellcasting',
      'spellcasting',
    ]);
  });
});

describe('aspectIndexOf', () => {
  it('should return an empty index for a null record', () => {
    expect(aspectIndexOf(null)).toEqual({ keys: [], records: [] });
  });

  it('should list only sections that carry aspects, with the record anchors', () => {
    expect(
      aspectIndexOf({
        sections: [
          { name: 'has', tags: ['damage:fire'] },
          { name: 'has-not' },
          { name: 'empty', tags: [] },
        ],
        records: ['mucklord'],
      }),
    ).toEqual({ keys: ['has'], records: ['mucklord'] });
  });

  it('should default records to none', () => {
    expect(aspectIndexOf({ title: 'Mucklord', tags: [] })).toEqual({ keys: [], records: [] });
  });
});
