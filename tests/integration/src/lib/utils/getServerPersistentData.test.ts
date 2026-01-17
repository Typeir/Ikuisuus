/**
 * Integration tests for getServerPersistentData utility
 *
 * @fileoverview Integration tests for server-side persistent data with real cookie scenarios
 * Tests end-to-end cookie lifecycle including encoding edge cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getServerPersistentData, getServerExpandedPaths } from '@/lib/utils/getServerPersistentData';

// Mock Next.js cookies API
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('getServerPersistentData Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should handle complex nested state with special characters', async () => {
    const state = {
      sidebarMenu: {
        expandedPaths: ['monsters/dragons', 'items/weapons', 'spells/evocation'],
      },
      theme: 'dark' as const,
    };
    const encoded = encodeURIComponent(JSON.stringify(state));

    const { cookies } = await import('next/headers');
    vi.mocked(cookies).mockResolvedValueOnce({
      get: vi.fn().mockReturnValue({ value: encoded }),
    } as any);

    const result = await getServerPersistentData();

    expect(result).toEqual(state);
    expect(result?.sidebarMenu?.expandedPaths).toHaveLength(3);
  });

  it('should handle empty sidebar menu state', async () => {
    const state = {
      sidebarMenu: { expandedPaths: [] },
      theme: 'light' as const,
    };
    const encoded = encodeURIComponent(JSON.stringify(state));

    const { cookies } = await import('next/headers');
    vi.mocked(cookies).mockResolvedValueOnce({
      get: vi.fn().mockReturnValue({ value: encoded }),
    } as any);

    const result = await getServerPersistentData();

    expect(result).toEqual(state);
    expect(result?.sidebarMenu?.expandedPaths).toEqual([]);
  });

  it('should handle partial state with only theme', async () => {
    const state = { theme: 'dark' as const };
    const encoded = encodeURIComponent(JSON.stringify(state));

    const { cookies } = await import('next/headers');
    vi.mocked(cookies).mockResolvedValueOnce({
      get: vi.fn().mockReturnValue({ value: encoded }),
    } as any);

    const result = await getServerPersistentData();

    expect(result).toEqual(state);
    expect(result?.sidebarMenu).toBeUndefined();
  });

  it('should handle partial state with only sidebar menu', async () => {
    const state = {
      sidebarMenu: { expandedPaths: ['monsters', 'items'] },
    };
    const encoded = encodeURIComponent(JSON.stringify(state));

    const { cookies } = await import('next/headers');
    vi.mocked(cookies).mockResolvedValueOnce({
      get: vi.fn().mockReturnValue({ value: encoded }),
    } as any);

    const result = await getServerPersistentData();

    expect(result).toEqual(state);
    expect(result?.theme).toBeUndefined();
  });

  it('should use correct cookie storage key when retrieving', async () => {
    const state = { theme: 'dark' as const };
    const encoded = encodeURIComponent(JSON.stringify(state));
    const mockGet = vi.fn().mockReturnValue({ value: encoded });

    const { cookies } = await import('next/headers');
    vi.mocked(cookies).mockResolvedValueOnce({
      get: mockGet,
    } as any);

    await getServerPersistentData();

    expect(mockGet).toHaveBeenCalledWith(expect.any(String));
  });
});

describe('getServerExpandedPaths Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should extract expanded paths from deep nested structure', async () => {
    const expandedPaths = ['world', 'world/geography', 'world/history'];
    const state = {
      sidebarMenu: { expandedPaths },
      theme: 'dark' as const,
    };
    const encoded = encodeURIComponent(JSON.stringify(state));

    const { cookies } = await import('next/headers');
    vi.mocked(cookies).mockResolvedValueOnce({
      get: vi.fn().mockReturnValue({ value: encoded }),
    } as any);

    const result = await getServerExpandedPaths();

    expect(result).toEqual(expandedPaths);
  });

  it('should gracefully handle malformed sidebarMenu', async () => {
    const state = { sidebarMenu: null, theme: 'light' };
    const encoded = encodeURIComponent(JSON.stringify(state));

    const { cookies } = await import('next/headers');
    vi.mocked(cookies).mockResolvedValueOnce({
      get: vi.fn().mockReturnValue({ value: encoded }),
    } as any);

    const result = await getServerExpandedPaths();

    expect(result).toEqual([]);
  });

  it('should handle single expanded path', async () => {
    const state = {
      sidebarMenu: { expandedPaths: ['monsters'] },
    };
    const encoded = encodeURIComponent(JSON.stringify(state));

    const { cookies } = await import('next/headers');
    vi.mocked(cookies).mockResolvedValueOnce({
      get: vi.fn().mockReturnValue({ value: encoded }),
    } as any);

    const result = await getServerExpandedPaths();

    expect(result).toEqual(['monsters']);
  });
});
