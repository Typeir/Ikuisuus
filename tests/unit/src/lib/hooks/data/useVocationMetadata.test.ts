/**
 * @fileoverview Unit tests for useVocationMetadata
 * @description Tests that useVocationMetadata fetches all three endpoints on
 * entering edit mode, does not re-fetch once loaded or when editing is false,
 * passes the locale to each endpoint, and returns empty arrays on fetch failure.
 *
 * @module tests/unit/src/lib/hooks/data/useVocationMetadata.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { useVocationMetadata } from '@/lib/hooks/data/useVocationMetadata';
import { fetcher } from '@/lib/fetch/fetcher';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/fetch/fetcher', () => ({
  fetcher: vi.fn(),
}));

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
  const fetcherMock = vi.mocked(fetcher);

  beforeEach(() => {
    fetcherMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does not fetch when editing is false', () => {
    renderHook(() => useVocationMetadata(false, 'en'), { wrapper });
    expect(fetcherMock).not.toHaveBeenCalled();
  });

  it('fetches all three endpoints on entering edit mode', async () => {
    fetcherMock
      .mockResolvedValueOnce(MOCK_BLOODLINES)
      .mockResolvedValueOnce(MOCK_VOCATIONS)
      .mockResolvedValueOnce(MOCK_SPECS);

    const { result } = renderHook(() => useVocationMetadata(true, 'en'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.bloodlines).toHaveLength(1);
    expect(result.current.vocOptions[0].slug).toBe('warrior');
    expect(result.current.specs[0].slug).toBe('champion');
    expect(fetcherMock).toHaveBeenCalledTimes(3);
  });

  it('does not re-fetch after metadata is already loaded', async () => {
    fetcherMock
      .mockResolvedValueOnce(MOCK_BLOODLINES)
      .mockResolvedValueOnce(MOCK_VOCATIONS)
      .mockResolvedValueOnce(MOCK_SPECS);

    const { result, rerender } = renderHook(
      ({ editing }) => useVocationMetadata(editing, 'en'),
      { initialProps: { editing: true }, wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    rerender({ editing: false });
    rerender({ editing: true });

    expect(fetcherMock).toHaveBeenCalledTimes(3);
  });

  it('returns empty arrays and sets isLoading false when fetch fails', async () => {
    fetcherMock.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useVocationMetadata(true, 'en'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.bloodlines).toHaveLength(0);
    expect(result.current.vocOptions).toHaveLength(0);
    expect(result.current.specs).toHaveLength(0);
  });

  it('passes the locale to each API endpoint', async () => {
    fetcherMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const { result } = renderHook(() => useVocationMetadata(true, 'es'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(fetcherMock).toHaveBeenCalledWith('/api/bloodlines?locale=es');
    expect(fetcherMock).toHaveBeenCalledWith('/api/vocations?locale=es');
    expect(fetcherMock).toHaveBeenCalledWith('/api/specializations?locale=es');
  });
});
