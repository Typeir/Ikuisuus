/**
 * MikroORM Singleton Unit Tests
 *
 * @fileoverview Tests for the getORM singleton and getEM fork helper.
 *
 * @module tests/unit/src/lib/db/orm/orm.test
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockFork = vi.fn().mockReturnValue({ name: 'forked-em' });
const mockInit = vi.fn().mockResolvedValue({
  em: { fork: mockFork },
});

vi.mock('@mikro-orm/postgresql', () => ({
  MikroORM: { init: mockInit },
}));

vi.mock('@/lib/db/orm/ormConfig', () => ({
  ormConfig: { entities: [], clientUrl: 'postgresql://test' },
}));

const ormKey = Symbol.for('mikro-orm.instance');
const originalNodeEnv = process.env.NODE_ENV;

beforeEach(() => {
  mockInit.mockClear();
  mockFork.mockClear();
  delete (globalThis as Record<symbol, unknown>)[ormKey];
});

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  delete (globalThis as Record<symbol, unknown>)[ormKey];
});

describe('getORM', () => {
  it('should initialise MikroORM and return the instance', async () => {
    vi.resetModules();
    const { getORM } = await import('@/lib/db/orm/orm');

    const orm = await getORM();
    expect(mockInit).toHaveBeenCalledTimes(1);
    expect(orm).toHaveProperty('em');
  });

  it('should return the cached instance on subsequent calls', async () => {
    vi.resetModules();
    process.env.NODE_ENV = 'development';
    const { getORM } = await import('@/lib/db/orm/orm');

    const first = await getORM();
    const second = await getORM();
    expect(first).toBe(second);
    expect(mockInit).toHaveBeenCalledTimes(1);
  });

  it('should deduplicate concurrent init calls', async () => {
    vi.resetModules();
    const { getORM } = await import('@/lib/db/orm/orm');

    const [a, b] = await Promise.all([getORM(), getORM()]);
    expect(a).toBe(b);
    expect(mockInit).toHaveBeenCalledTimes(1);
  });
});

describe('getEM', () => {
  it('should return a forked EntityManager', async () => {
    vi.resetModules();
    const { getEM } = await import('@/lib/db/orm/orm');

    const em = await getEM();
    expect(mockFork).toHaveBeenCalled();
    expect(em).toEqual({ name: 'forked-em' });
  });
});
