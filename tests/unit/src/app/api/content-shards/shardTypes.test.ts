/**
 * @fileoverview Content Shard Type Registry Unit Tests
 * @description Tests registry coverage and the repository-backed locate wiring.
 *
 * @module tests/unit/src/app/api/content-shards/shardTypes.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { describe, expect, it, vi } from 'vitest';

const { mockGetBySlug } = vi.hoisted(() => ({
  mockGetBySlug: vi.fn(),
}));

vi.mock('@/lib/db/content/repositories/vocationRepository', () => ({
  vocationRepository: { getBySlug: mockGetBySlug },
}));

vi.mock('@/lib/db/content/repositories/featRepository', () => ({
  featRepository: { getBySlug: vi.fn() },
}));

vi.mock('@/lib/db/content/repositories/bloodlineRepository', () => ({
  bloodlineRepository: { getBySlug: vi.fn() },
}));

vi.mock('@/lib/db/content/repositories/specializationRepository', () => ({
  specializationRepository: { getBySlug: vi.fn() },
}));

import { shardTypeRegistry } from '@/app/api/content-shards/shardTypes';

describe('shardTypeRegistry', () => {
  it('registers every served type', () => {
    expect(Object.keys(shardTypeRegistry).sort()).toEqual([
      'bloodlines',
      'feats',
      'keyword',
      'specializations',
      'vocations',
    ]);
  });

  it('locates a repository address through its record', async () => {
    mockGetBySlug.mockResolvedValue({
      file: 'character-creation/vocations/Berserker.mdx',
      link: '/library/character-creation/vocations/Berserker',
      features: [{ name: 'Rage' }],
    });

    const target = await shardTypeRegistry.vocations.locate('en', 'Berserker');
    expect(mockGetBySlug).toHaveBeenCalledWith('en', 'Berserker');
    expect(target).toMatchObject({
      file: 'character-creation/vocations/Berserker.mdx',
      route: '/library/character-creation/vocations/Berserker',
    });
    expect(target?.entriesOf('')).toEqual([{ name: 'Rage' }]);
  });

  it('locates nothing for an unknown address', async () => {
    mockGetBySlug.mockResolvedValue(null);
    const target = await shardTypeRegistry.vocations.locate('en', 'unknown');
    expect(target).toBeNull();
  });
});
