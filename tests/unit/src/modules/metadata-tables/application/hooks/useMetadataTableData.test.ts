import { useMetadataTableData } from '@/modules/metadata-tables/application/hooks/useMetadataTableData';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { SWRConfig } from 'swr';
import { describe, expect, it, vi } from 'vitest';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(
    SWRConfig,
    { value: { provider: () => new Map(), dedupingInterval: 0 } },
    children,
  );

describe('useMetadataTableData', () => {
  it('loads data through fetcher', async () => {
    const fetcher = vi.fn().mockResolvedValue([{ slug: 'goblin' }]);

    const { result } = renderHook(
      () => useMetadataTableData(fetcher, 'en', 'monsters'),
      { wrapper },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetcher).toHaveBeenCalledWith('en');
    expect(result.current.data).toEqual([{ slug: 'goblin' }]);
    expect(result.current.error).toBeNull();
  });

  it('exposes error message on failure', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('boom'));

    const { result } = renderHook(
      () => useMetadataTableData(fetcher, 'en', 'monsters'),
      { wrapper },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBe('boom');
  });
});
