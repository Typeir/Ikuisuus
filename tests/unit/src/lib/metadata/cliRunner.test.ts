/**
 * cliRunner Unit Tests
 *
 * @fileoverview Tests for the CLI runner that wraps generator main functions
 * with --persist flag handling.
 *
 * @module tests/unit/lib/metadata/cliRunner
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logging/logger', () => ({
  createLogger: () => ({
    message: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
}));

let runWithCli: typeof import('@scripts/metadata/cliRunner').runWithCli;

beforeEach(async () => {
  vi.resetModules();
  const mod = await import('@scripts/metadata/cliRunner');
  runWithCli = mod.runWithCli;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('runWithCli', () => {
  it('should call mainFn without storage when --persist is absent', async () => {
    const mainFn = vi.fn().mockResolvedValue(undefined);

    await runWithCli(mainFn);

    expect(mainFn).toHaveBeenCalledWith({ storage: undefined });
  });

  it('should propagate errors from mainFn', async () => {
    const mainFn = vi.fn().mockRejectedValue(new Error('generator failed'));

    await expect(runWithCli(mainFn)).rejects.toThrow('generator failed');
  });
});
