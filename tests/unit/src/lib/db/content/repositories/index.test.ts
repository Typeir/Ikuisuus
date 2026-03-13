/**
 * Repository Barrel Export Unit Tests
 *
 * @fileoverview Tests that the repository barrel re-exports all expected symbols.
 *
 * @module tests/unit/lib/db/content/repositories/index
 */

import { describe, expect, it } from 'vitest';

describe('repositories/index barrel', () => {
  it('should re-export all repository instances', async () => {
    const barrel = await import('@/lib/db/content/repositories');

    expect(barrel.monsterRepository).toBeDefined();
    expect(barrel.heirloomRepository).toBeDefined();
    expect(barrel.spellRepository).toBeDefined();
    expect(barrel.trinketRepository).toBeDefined();
  });

  it('should expose the same instances as the individual modules', async () => {
    const barrel = await import('@/lib/db/content/repositories');
    const { monsterRepository } =
      await import('@/lib/db/content/repositories/monsterRepository');
    const { heirloomRepository } =
      await import('@/lib/db/content/repositories/heirloomRepository');
    const { spellRepository } =
      await import('@/lib/db/content/repositories/spellRepository');
    const { trinketRepository } =
      await import('@/lib/db/content/repositories/trinketRepository');

    expect(barrel.monsterRepository).toBe(monsterRepository);
    expect(barrel.heirloomRepository).toBe(heirloomRepository);
    expect(barrel.spellRepository).toBe(spellRepository);
    expect(barrel.trinketRepository).toBe(trinketRepository);
  });
});
