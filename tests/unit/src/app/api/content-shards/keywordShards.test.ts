/**
 * @fileoverview keywordShardsFor Tests
 * @description Covers the resolution the shard routes attach to their payload,
 * and its refusal to fail the prose it accompanies.
 *
 * @module tests/unit/src/app/api/content-shards/keywordShards.test
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const resolveShardByRef = vi.fn();

vi.mock('@/lib/md/resolveShardByRef', () => ({
  resolveShardByRef: (...args: unknown[]) => resolveShardByRef(...args),
}));

vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ warning: vi.fn(), error: vi.fn(), message: vi.fn() }),
  },
}));

import { keywordShardsFor } from '@/app/api/content-shards/keywordShards';

const RESIST = {
  id: 'kw--resist',
  heading: 'Resist',
  source: 'Save against it.',
  href: 'library/rules/steel-and-strife/effects-and-enhancements#resist',
};

beforeEach(() => {
  resolveShardByRef.mockReset().mockResolvedValue(RESIST);
});

afterEach(() => vi.restoreAllMocks());

describe('keywordShardsFor', () => {
  it('should resolve the keywords the prose references', async () => {
    const shards = await keywordShardsFor(
      { main: 'You may [# kw:resist #] it.' },
      'en',
    );

    expect(shards).toEqual([RESIST]);
    expect(resolveShardByRef).toHaveBeenCalledWith('resist', 'en');
  });

  it('should search every shard, not just the first', async () => {
    await keywordShardsFor(
      { main: '[# kw:resist #]', Rage: '[# kw:briefly #]' },
      'en',
    );

    const asked = resolveShardByRef.mock.calls.map(([ref]) => ref);
    expect(asked).toContain('resist');
    expect(asked).toContain('briefly');
  });

  it('should drop references that resolve to nothing', async () => {
    resolveShardByRef.mockResolvedValue(null);

    expect(
      await keywordShardsFor({ main: '[# kw:nonexistent #]' }, 'en'),
    ).toEqual([]);
  });

  it('should not resolve anything for prose with no references', async () => {
    expect(await keywordShardsFor({ main: 'Plain prose.' }, 'en')).toEqual([]);
    expect(resolveShardByRef).not.toHaveBeenCalled();
  });

  it('should skip resolution entirely when there is no prose', async () => {
    expect(await keywordShardsFor({}, 'en')).toEqual([]);
    expect(await keywordShardsFor({ main: '' }, 'en')).toEqual([]);
    expect(resolveShardByRef).not.toHaveBeenCalled();
  });

  /* A missing definition costs a card. It must not cost the prose. */
  it('should return nothing rather than throw when resolution fails', async () => {
    resolveShardByRef.mockRejectedValue(new Error('metadata unreachable'));

    expect(
      await keywordShardsFor({ main: 'You may [# kw:resist #] it.' }, 'en'),
    ).toEqual([]);
  });
});
