/**
 * Content Module Barrel Export Unit Tests
 *
 * @fileoverview Tests that the content barrel re-exports all expected symbols.
 *
 * @module tests/unit/lib/db/content/index
 */

import { describe, expect, it } from 'vitest';

describe('content/index barrel', () => {
  it('should re-export repository instances', async () => {
    const barrel = await import('@/lib/db/content');

    expect(barrel.monsterRepository).toBeDefined();
    expect(barrel.heirloomRepository).toBeDefined();
    expect(barrel.spellRepository).toBeDefined();
    expect(barrel.trinketRepository).toBeDefined();
  });

  it('should export repository instances with expected methods', async () => {
    const barrel = await import('@/lib/db/content');

    expect(typeof barrel.monsterRepository.list).toBe('function');
    expect(typeof barrel.monsterRepository.listIndex).toBe('function');
    expect(typeof barrel.monsterRepository.getBySlug).toBe('function');

    expect(typeof barrel.heirloomRepository.list).toBe('function');
    expect(typeof barrel.heirloomRepository.getBySlug).toBe('function');

    expect(typeof barrel.spellRepository.list).toBe('function');
    expect(typeof barrel.spellRepository.listIndex).toBe('function');
    expect(typeof barrel.spellRepository.listBySlugs).toBe('function');
    expect(typeof barrel.spellRepository.getBySlug).toBe('function');

    expect(typeof barrel.trinketRepository.list).toBe('function');
    expect(typeof barrel.trinketRepository.getBySlug).toBe('function');
  });
});
