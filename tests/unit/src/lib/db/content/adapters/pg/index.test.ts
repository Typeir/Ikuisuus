/**
 * PG Adapters Barrel Export Unit Tests
 *
 * @fileoverview Tests that the PG adapters barrel re-exports all expected symbols.
 *
 * @module tests/unit/lib/db/content/adapters/pg/index
 */

import { describe, expect, it } from 'vitest';

vi.mock('@/lib/db/postgres/pool', () => ({
  query: vi.fn(),
  getPool: vi.fn(),
}));

import { vi } from 'vitest';

describe('adapters/pg/index barrel', () => {
  it('should re-export all PG repository implementations', async () => {
    const barrel = await import('@/lib/db/content/adapters/pg');

    expect(barrel.pgMonsterRepository).toBeDefined();
    expect(barrel.pgHeirloomRepository).toBeDefined();
    expect(barrel.pgSpellRepository).toBeDefined();
    expect(barrel.pgTrinketRepository).toBeDefined();
  });

  it('should export repositories with expected methods', async () => {
    const barrel = await import('@/lib/db/content/adapters/pg');

    expect(typeof barrel.pgMonsterRepository.list).toBe('function');
    expect(typeof barrel.pgMonsterRepository.listIndex).toBe('function');
    expect(typeof barrel.pgMonsterRepository.getBySlug).toBe('function');

    expect(typeof barrel.pgHeirloomRepository.list).toBe('function');
    expect(typeof barrel.pgHeirloomRepository.getBySlug).toBe('function');

    expect(typeof barrel.pgSpellRepository.list).toBe('function');
    expect(typeof barrel.pgSpellRepository.listBySlugs).toBe('function');

    expect(typeof barrel.pgTrinketRepository.list).toBe('function');
    expect(typeof barrel.pgTrinketRepository.getBySlug).toBe('function');
  });
});
