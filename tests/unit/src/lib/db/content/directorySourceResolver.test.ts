/**
 * @fileoverview Unit Tests — directorySourceResolver
 * @description Validates that the correct adapter is selected based on runtime
 * environment variables and NEXT_PHASE.
 *
 * @module tests/unit/lib/db/content/directorySourceResolver
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/adapters/fs/fsDirectorySource', () => ({
  fsDirectorySource: { listEntries: vi.fn().mockResolvedValue([]) },
}));

vi.mock('@/lib/db/content/adapters/github/githubDirectorySource', () => ({
  githubDirectorySource: { listEntries: vi.fn().mockResolvedValue([]) },
}));

import { fsDirectorySource } from '@/lib/db/content/adapters/fs/fsDirectorySource';
import { githubDirectorySource } from '@/lib/db/content/adapters/github/githubDirectorySource';
import { resolveDirectorySource } from '@/lib/db/content/directorySourceResolver';

describe('resolveDirectorySource', () => {
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    savedEnv.CONTENT_FETCH_MODE = process.env.CONTENT_FETCH_MODE;
    savedEnv.NODE_ENV = process.env.NODE_ENV;
    savedEnv.NEXT_PHASE = process.env.NEXT_PHASE;

    delete process.env.CONTENT_FETCH_MODE;
    delete process.env.NEXT_PHASE;
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(savedEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it('returns fsDirectorySource when CONTENT_FETCH_MODE is build', () => {
    process.env.CONTENT_FETCH_MODE = 'build';
    expect(resolveDirectorySource()).toBe(fsDirectorySource);
  });

  it('returns githubDirectorySource when CONTENT_FETCH_MODE is runtime', () => {
    process.env.CONTENT_FETCH_MODE = 'runtime';
    expect(resolveDirectorySource()).toBe(githubDirectorySource);
  });

  it('returns fsDirectorySource when NODE_ENV is development', () => {
    process.env.NODE_ENV = 'development';
    expect(resolveDirectorySource()).toBe(fsDirectorySource);
  });

  it('returns fsDirectorySource when NEXT_PHASE is phase-production-build', () => {
    process.env.NEXT_PHASE = 'phase-production-build';
    expect(resolveDirectorySource()).toBe(fsDirectorySource);
  });

  it('returns fsDirectorySource when NEXT_PHASE is phase-development-server', () => {
    process.env.NEXT_PHASE = 'phase-development-server';
    expect(resolveDirectorySource()).toBe(fsDirectorySource);
  });

  it('CONTENT_FETCH_MODE=runtime overrides NODE_ENV=development', () => {
    process.env.CONTENT_FETCH_MODE = 'runtime';
    process.env.NODE_ENV = 'development';
    expect(resolveDirectorySource()).toBe(githubDirectorySource);
  });

  it('CONTENT_FETCH_MODE=build overrides NEXT_PHASE in production', () => {
    process.env.CONTENT_FETCH_MODE = 'build';
    process.env.NODE_ENV = 'production';
    expect(resolveDirectorySource()).toBe(fsDirectorySource);
  });
});
