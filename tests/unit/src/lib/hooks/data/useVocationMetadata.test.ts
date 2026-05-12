/**
 * @fileoverview Unit tests for useVocationMetadata
 * @description Tests the useVocationMetadata hook — verifying that metadata is
 * fetched once on entering edit mode, the cancel-flag prevents stale updates,
 * and failed fetches mark metaFetched without setting state.
 *
 * @module tests/unit/lib/hooks/data/useVocationMetadata
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { useVocationMetadata } from '@/lib/hooks/data/useVocationMetadata';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(
    SWRConfig,
    { value: { provider: () => new Map(), dedupingInterval: 0 } },
    children,
  );

const MOCK_BLOODLINES = [
  {
    slug: 'empyrean',
    title: 'Empyrean',
    file: 'empyrean.bloodline.mdx',
    boonBudget: 10,
  },
];
const MOCK_VOCATIONS = [
  {
    slug: 'warrior',
    title: 'Warrior',
    features: [{ level: 1, name: 'Fighting Style' }],
  },
];
const MOCK_SPECS = [
  { slug: 'champion', title: 'Champion', vocation: 'warrior', features: [] },
];

describe('useVocationMetadata', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does not fetch when editing is false', () => {
    renderHook(() => useVocationMetadata(false, 'en'), { wrapper });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('fetches all three endpoints on entering edit mode', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_BLOODLINES),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_VOCATIONS),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_SPECS),
      });

    const { result } = renderHook(() => useVocationMetadata(true, 'en'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.bloodlines).toHaveLength(1);
    expect(result.current.vocOptions[0].slug).toBe('warrior');
    expect(result.current.specs[0].slug).toBe('champion');
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('does not re-fetch after metadata is already loaded', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_BLOODLINES),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_VOCATIONS),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_SPECS),
      });

    const { result, rerender } = renderHook(
      ({ editing }) => useVocationMetadata(editing, 'en'),
      { initialProps: { editing: true }, wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    rerender({ editing: false });
    rerender({ editing: true });

    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('returns empty arrays and sets isLoading false when fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useVocationMetadata(true, 'en'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.bloodlines).toHaveLength(0);
    expect(result.current.vocOptions).toHaveLength(0);
    expect(result.current.specs).toHaveLength(0);
  });

  it('passes the locale to each API endpoint', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });

    const { result } = renderHook(() => useVocationMetadata(true, 'es'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockFetch).toHaveBeenCalledWith('/api/bloodlines?locale=es');
    expect(mockFetch).toHaveBeenCalledWith('/api/vocations?locale=es');
    expect(mockFetch).toHaveBeenCalledWith('/api/specializations?locale=es');
  });
});
