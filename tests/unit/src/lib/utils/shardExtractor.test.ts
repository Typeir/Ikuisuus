/**
 * @fileoverview Shard Extractor Unit Tests
 * @description Tests for `fetchShard` and `computeBpSpent` from shardExtractor.ts.
 *
 * @module tests/unit/lib/utils/shardExtractor
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { CharacterShard } from '@/lib/types/character';
import { computeBpSpent, fetchShard } from '@/lib/utils/shardExtractor';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetch = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fetchShard', () => {
  it('calls /api/shards with file and heading params', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          startLine: 3,
          endLine: 6,
          text: '## Extended Reach\n\nYour unarmed reach increases by 5 ft.',
        }),
        { status: 200 },
      ),
    );

    const shard = await fetchShard({
      sourceFile: 'character-creation/bloodlines/empyrean.bloodline.mdx',
      heading: 'Extended Reach',
      category: 'boon',
      bpCost: 3,
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    const calledUrl = String(mockFetch.mock.calls[0][0]);
    expect(calledUrl).toContain('file=character-creation');
    expect(calledUrl).toContain('heading=Extended+Reach');
    expect(shard.id).toBe(
      'character-creation/bloodlines/empyrean.bloodline.mdx::Extended Reach',
    );
    expect(shard.category).toBe('boon');
    expect(shard.bpCost).toBe(3);
    expect(shard.cachedText).toContain('unarmed reach');
  });

  it('caches the full body text (all lines after heading)', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          startLine: 3,
          endLine: 10,
          text: '## Extended Reach\n\nFirst paragraph text.\n\nSecond paragraph text.',
        }),
        { status: 200 },
      ),
    );

    const shard = await fetchShard({
      sourceFile: 'file.mdx',
      heading: 'Extended Reach',
      category: 'boon',
    });

    expect(shard.cachedText).toBe('First paragraph text.\n\nSecond paragraph text.');
  });

  it('throws when the API returns an error status', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Heading not found: Fake' }), {
        status: 404,
      }),
    );

    await expect(
      fetchShard({ sourceFile: 'file.mdx', heading: 'Fake', category: 'boon' }),
    ).rejects.toThrow('Heading not found: Fake');
  });
});

describe('computeBpSpent', () => {
  it('sums bpCost for boon shards only', () => {
    const shards: CharacterShard[] = [
      {
        id: '1',
        sourceFile: 'f.mdx',
        heading: 'A',
        category: 'boon',
        bpCost: 3,
      },
      {
        id: '2',
        sourceFile: 'f.mdx',
        heading: 'B',
        category: 'boon',
        bpCost: 2,
      },
      {
        id: '3',
        sourceFile: 'f.mdx',
        heading: 'C',
        category: 'vocation-feature',
        level: 1,
      },
    ];
    expect(computeBpSpent(shards)).toBe(5);
  });

  it('returns 0 for empty array', () => {
    expect(computeBpSpent([])).toBe(0);
  });

  it('treats boon shards without bpCost as 0', () => {
    const shards: CharacterShard[] = [
      { id: '1', sourceFile: 'f.mdx', heading: 'A', category: 'boon' },
    ];
    expect(computeBpSpent(shards)).toBe(0);
  });
});
