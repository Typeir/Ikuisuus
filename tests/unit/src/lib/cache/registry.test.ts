/**
 * @fileoverview Server Cache Registry Unit Tests
 * @description Tests registration, clear-all isolation, and epoch-driven
 * freshness.
 *
 * @module tests/unit/src/lib/cache/registry.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCurrent = vi.fn();

vi.mock('@/lib/cache/epoch', () => ({
  cacheEpochSource: {
    current: (...args: unknown[]) => mockCurrent(...args),
    bump: vi.fn(),
  },
}));

vi.mock('@/lib/logging/logger', () => ({
  logger: { child: () => ({ warning: vi.fn() }) },
}));

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let registry: typeof import('@/lib/cache/registry');

beforeEach(async () => {
  vi.resetModules();
  mockCurrent.mockReset().mockResolvedValue(null);
  registry = await import('@/lib/cache/registry');
});

describe('clearServerCaches', () => {
  it('clears every registered cache', () => {
    const a = vi.fn();
    const b = vi.fn();
    registry.registerServerCache('a', a);
    registry.registerServerCache('b', b);

    registry.clearServerCaches();

    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
  });

  it('keeps clearing when one cache throws', () => {
    const after = vi.fn();
    registry.registerServerCache('bad', () => {
      throw new Error('boom');
    });
    registry.registerServerCache('after', after);

    expect(() => registry.clearServerCaches()).not.toThrow();
    expect(after).toHaveBeenCalledOnce();
  });

  it('replaces a clear function re-registered under the same name', () => {
    const first = vi.fn();
    const second = vi.fn();
    registry.registerServerCache('same', first);
    registry.registerServerCache('same', second);

    registry.clearServerCaches();

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });
});

describe('ensureCachesFresh', () => {
  it('does nothing without an epoch source', async () => {
    const clear = vi.fn();
    registry.registerServerCache('a', clear);

    await registry.ensureCachesFresh();

    expect(clear).not.toHaveBeenCalled();
  });

  it('adopts the first epoch without clearing', async () => {
    const clear = vi.fn();
    registry.registerServerCache('a', clear);
    mockCurrent.mockResolvedValue('e1');

    await registry.ensureCachesFresh();
    await registry.ensureCachesFresh();

    expect(clear).not.toHaveBeenCalled();
  });

  it('clears once when the epoch moves', async () => {
    const clear = vi.fn();
    registry.registerServerCache('a', clear);
    mockCurrent.mockResolvedValue('e1');
    await registry.ensureCachesFresh();

    mockCurrent.mockResolvedValue('e2');
    await registry.ensureCachesFresh();
    await registry.ensureCachesFresh();

    expect(clear).toHaveBeenCalledOnce();
  });

  it('keeps caches when the epoch read fails', async () => {
    const clear = vi.fn();
    registry.registerServerCache('a', clear);
    mockCurrent.mockRejectedValue(new Error('store down'));

    await expect(registry.ensureCachesFresh()).resolves.toBeUndefined();
    expect(clear).not.toHaveBeenCalled();
  });
});
