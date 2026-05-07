/**
 * FS Adapters Barrel Export Unit Tests
 *
 * @fileoverview Tests that the FS adapters barrel re-exports all expected symbols.
 *
 * @module tests/unit/lib/db/content/adapters/fs/index
 */

import { describe, expect, it } from 'vitest';

describe('adapters/fs/index barrel', () => {
  it('should re-export all FS repository implementations', async () => {
    const barrel = await import('@/lib/db/content/adapters/fs');

    expect(barrel.fsMonsterRepository).toBeDefined();
    expect(barrel.fsHeirloomRepository).toBeDefined();
    expect(barrel.fsSpellRepository).toBeDefined();
    expect(barrel.fsTrinketRepository).toBeDefined();
    expect(barrel.fsFeatRepository).toBeDefined();
    expect(barrel.readMetadataFiles).toBeDefined();
  });

  it('should export readMetadataFiles as a function', async () => {
    const barrel = await import('@/lib/db/content/adapters/fs');

    expect(typeof barrel.readMetadataFiles).toBe('function');
  });

  it('should export repositories with expected methods', async () => {
    const barrel = await import('@/lib/db/content/adapters/fs');

    expect(typeof barrel.fsMonsterRepository.list).toBe('function');
    expect(typeof barrel.fsMonsterRepository.listIndex).toBe('function');
    expect(typeof barrel.fsMonsterRepository.getBySlug).toBe('function');

    expect(typeof barrel.fsHeirloomRepository.list).toBe('function');
    expect(typeof barrel.fsHeirloomRepository.getBySlug).toBe('function');

    expect(typeof barrel.fsSpellRepository.list).toBe('function');
    expect(typeof barrel.fsSpellRepository.listBySlugs).toBe('function');

    expect(typeof barrel.fsTrinketRepository.list).toBe('function');
    expect(typeof barrel.fsTrinketRepository.getBySlug).toBe('function');

    expect(typeof barrel.fsFeatRepository.list).toBe('function');
    expect(typeof barrel.fsFeatRepository.getBySlug).toBe('function');
  });
});
