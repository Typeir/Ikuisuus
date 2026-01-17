/**
 * Tests for getServerPersistentData utility
 *
 * @fileoverview Unit tests for server-side persistent data reading from cookies
 * Tests cookie decoding, JSON parsing, error handling, and expanded paths extraction
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getServerPersistentData, getServerExpandedPaths } from '@/lib/utils/getServerPersistentData';
import { PERSISTENT_UI_STORAGE_KEY } from '@/lib/types/persistentUiState';

// Mock Next.js cookies API
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('getServerPersistentData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return null when cookie does not exist', async () => {
    const { cookies } = await import('next/headers');
    vi.mocked(cookies).mockResolvedValueOnce({
      get: vi.fn().mockReturnValue(undefined),
    } as any);

    const result = await getServerPersistentData();

    expect(result).toBeNull();
  });

  it('should return null when cookie value is empty', async () => {
    const { cookies } = await import('next/headers');
    vi.mocked(cookies).mockResolvedValueOnce({
      get: vi.fn().mockReturnValue({ value: '' }),
    } as any);

    const result = await getServerPersistentData();

    expect(result).toBeNull();
  });

  it('should decode and parse valid cookie value', async () => {
    const state = {
      sidebarMenu: { expandedPaths: ['monsters', 'items'] },
      theme: 'dark',
    };
    const encoded = encodeURIComponent(JSON.stringify(state));

    const { cookies } = await import('next/headers');
    vi.mocked(cookies).mockResolvedValueOnce({
      get: vi.fn().mockReturnValue({ value: encoded }),
    } as any);

    const result = await getServerPersistentData();

    expect(result).toEqual(state);
  });

  it('should return null when JSON parsing fails', async () => {
    const { cookies } = await import('next/headers');
    vi.mocked(cookies).mockResolvedValueOnce({
      get: vi.fn().mockReturnValue({ value: 'invalid-json' }),
    } as any);

    const result = await getServerPersistentData();

    expect(result).toBeNull();
  });

  it('should return null when cookie retrieval throws', async () => {
    const { cookies } = await import('next/headers');
    vi.mocked(cookies).mockRejectedValueOnce(new Error('Cookie access failed'));

    const result = await getServerPersistentData();

    expect(result).toBeNull();
  });
});

describe('getServerExpandedPaths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return expanded paths from persistent data', async () => {
    const expandedPaths = ['monsters', 'items', 'spells'];
    const state = {
      sidebarMenu: { expandedPaths },
      theme: 'light',
    };
    const encoded = encodeURIComponent(JSON.stringify(state));

    const { cookies } = await import('next/headers');
    vi.mocked(cookies).mockResolvedValueOnce({
      get: vi.fn().mockReturnValue({ value: encoded }),
    } as any);

    const result = await getServerExpandedPaths();

    expect(result).toEqual(expandedPaths);
  });

  it('should return empty array when expandedPaths is not set', async () => {
    const state = { theme: 'dark' };
    const encoded = encodeURIComponent(JSON.stringify(state));

    const { cookies } = await import('next/headers');
    vi.mocked(cookies).mockResolvedValueOnce({
      get: vi.fn().mockReturnValue({ value: encoded }),
    } as any);

    const result = await getServerExpandedPaths();

    expect(result).toEqual([]);
  });

  it('should return empty array when cookie does not exist', async () => {
    const { cookies } = await import('next/headers');
    vi.mocked(cookies).mockResolvedValueOnce({
      get: vi.fn().mockReturnValue(undefined),
    } as any);

    const result = await getServerExpandedPaths();

    expect(result).toEqual([]);
  });

  it('should return empty array when sidebarMenu is not set', async () => {
    const state = { theme: 'light' };
    const encoded = encodeURIComponent(JSON.stringify(state));

    const { cookies } = await import('next/headers');
    vi.mocked(cookies).mockResolvedValueOnce({
      get: vi.fn().mockReturnValue({ value: encoded }),
    } as any);

    const result = await getServerExpandedPaths();

    expect(result).toEqual([]);
  });
});
