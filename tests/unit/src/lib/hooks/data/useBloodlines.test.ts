import { useBloodlines } from '@/lib/hooks/data/useBloodlines';
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

describe('useBloodlines', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('returns bloodlines after loading', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([{ slug: 'crimson', title: 'Crimson', boons: [] }]),
    });

    const { result } = renderHook(() => useBloodlines({ locale: 'en' }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.bloodlines).toHaveLength(1);
    expect(result.current.bloodlines[0].slug).toBe('crimson');
  });

  it('returns empty array when disabled', () => {
    const { result } = renderHook(
      () => useBloodlines({ locale: 'en', enabled: false }),
      { wrapper },
    );
    expect(result.current.bloodlines).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
