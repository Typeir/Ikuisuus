/**
 * @fileoverview Unit tests for fetchFeatureShards
 * @description Covers vocation and specialization endpoints, shard assembly,
 * and the empty-array fallback on failed fetches.
 *
 * @module tests/unit/src/modules/character-builder/lib/utils/featureShards.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { fetchFeatureShards } from '@/modules/character-builder/lib/utils/featureShards';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('fetchFeatureShards', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns assembled shards for a vocation endpoint', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          shards: [
            {
              id: 'fighting-style',
              key: 'Fighting Style',
              heading: 'Fighting Style',
              source: 'Choose a fighting style.',
              href: 'library/x#fighting-style',
            },
          ],
        }),
    });

    const result = await fetchFeatureShards(
      'warrior',
      'src/content/en/character-creation/vocations/warrior/main.mdx',
      [{ level: 1, name: 'Fighting Style' }],
      'vocation-feature',
      'vocations',
      'en',
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('warrior::1::Fighting Style');
    expect(result[0].sourceFile).toBe(
      'character-creation/vocations/warrior/main.mdx',
    );
    expect(result[0].category).toBe('vocation-feature');
    expect(result[0].cachedText).toBe('Choose a fighting style.');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/content-shards/vocations/warrior?locale=en',
    );
  });

  it('returns assembled shards for a specialization endpoint', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          shards: [
            {
              id: 'improved-critical',
              key: 'Improved Critical',
              heading: 'Improved Critical',
              source: 'Your crits improve.',
              href: 'library/x#improved-critical',
            },
          ],
        }),
    });

    const result = await fetchFeatureShards(
      'champion',
      'src/content/en/character-creation/vocations/Warrior/champion.specialization.mdx',
      [{ level: 3, name: 'Improved Critical' }],
      'specialization-feature',
      'specializations',
      'en',
    );

    expect(result[0].category).toBe('specialization-feature');
    expect(result[0].id).toBe('champion::3::Improved Critical');
    expect(result[0].sourceFile).toBe(
      'character-creation/vocations/Warrior/champion.specialization.mdx',
    );
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/content-shards/specializations/champion?locale=en',
    );
  });

  it('returns empty array when fetch response is not ok', async () => {
    mockFetch.mockResolvedValue({ ok: false });
    const result = await fetchFeatureShards(
      'warrior',
      'src/content/en/character-creation/vocations/warrior/main.mdx',
      [{ level: 1, name: 'Fighting Style' }],
      'vocation-feature',
      'vocations',
      'en',
    );
    expect(result).toEqual([]);
  });

  it('returns empty array when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    const result = await fetchFeatureShards(
      'warrior',
      'src/content/en/character-creation/vocations/warrior/main.mdx',
      [{ level: 1, name: 'Fighting Style' }],
      'vocation-feature',
      'vocations',
      'en',
    );
    expect(result).toEqual([]);
  });

  it('maps cachedText as undefined when shard key is absent', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ shards: [] }),
    });

    const result = await fetchFeatureShards(
      'warrior',
      'src/content/en/character-creation/vocations/warrior/main.mdx',
      [{ level: 1, name: 'Missing Feature' }],
      'vocation-feature',
      'vocations',
      'en',
    );

    expect(result[0].cachedText).toBeUndefined();
  });
});
