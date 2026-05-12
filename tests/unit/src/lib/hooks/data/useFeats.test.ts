import { useFeats } from '@/lib/hooks/data/useFeats';
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

describe('useFeats', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('returns feats after loading', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ slug: 'iron-will', title: 'Iron Will' }]),
    });

    const { result } = renderHook(() => useFeats({ locale: 'en' }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.feats).toHaveLength(1);
    expect(result.current.feats[0].slug).toBe('iron-will');
  });

  it('returns empty array when disabled', () => {
    const { result } = renderHook(
      () => useFeats({ locale: 'en', enabled: false }),
      { wrapper },
    );
    expect(result.current.feats).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
