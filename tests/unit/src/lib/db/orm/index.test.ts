/**
 * ORM Module Barrel Export Unit Tests
 *
 * @fileoverview Tests that the ORM barrel re-exports all expected symbols.
 *
 * @module tests/unit/src/lib/db/orm/index.test
 */

import { describe, expect, it, vi } from 'vitest';

vi.mock('@mikro-orm/postgresql', () => ({
  MikroORM: { init: vi.fn().mockResolvedValue({ em: { fork: vi.fn() } }) },
  defineConfig: vi.fn((cfg: unknown) => cfg),
}));

describe('orm/index barrel', () => {
  it('should re-export getEM and getORM from orm', async () => {
    vi.resetModules();
    const mod = await import('@/lib/db/orm/index');

    expect(mod.getEM).toBeDefined();
    expect(mod.getORM).toBeDefined();
    expect(typeof mod.getEM).toBe('function');
    expect(typeof mod.getORM).toBe('function');
  });

  it('should re-export ormConfig', async () => {
    vi.resetModules();
    const mod = await import('@/lib/db/orm/index');

    expect(mod.ormConfig).toBeDefined();
    expect(mod.ormConfig).toHaveProperty('entities');
  });
});
