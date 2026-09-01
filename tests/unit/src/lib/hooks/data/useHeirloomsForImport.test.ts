/**
 * @fileoverview useHeirloomsForImport Tests
 * @module tests/unit/src/lib/hooks/data/useHeirloomsForImport.test
 */

import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { fetcher } = vi.hoisted(() => ({ fetcher: vi.fn() }));

vi.mock('@/lib/fetch/fetcher', () => ({ fetcher }));

import { useHeirloomsForImport } from '@/lib/hooks/data/useHeirloomsForImport';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(
    SWRConfig,
    { value: { provider: () => new Map(), dedupingInterval: 0 } },
    children,
  );

describe('useHeirloomsForImport', () => {
  beforeEach(() => {
    fetcher.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('placeholder', () => {
    expect(true).toBe(true);
  });

  it('returns heirlooms after loading', async () => {
    fetcher.mockResolvedValue([{ slug: 'phoenix', title: 'Phoenix' }]);

    const { result } = renderHook(
      () => useHeirloomsForImport({ locale: 'en' }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.heirlooms).toHaveLength(1);
    expect(result.current.heirlooms[0].slug).toBe('phoenix');
  });

  it('returns empty array when disabled', () => {
    const { result } = renderHook(
      () => useHeirloomsForImport({ locale: 'en', enabled: false }),
      { wrapper },
    );
    expect(result.current.heirlooms).toEqual([]);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
