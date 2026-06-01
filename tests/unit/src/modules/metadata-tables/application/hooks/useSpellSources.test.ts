import { useSpellSources } from '@/modules/metadata-tables/application/hooks/useSpellSources';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(
    SWRConfig,
    { value: { provider: () => new Map(), dedupingInterval: 0 } },
    children,
  );

describe('useSpellSources', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads data from endpoint sources', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ slug: 'fireball', title: 'Fireball', level: 3 }]),
    });

    const { result } = renderHook(() => useSpellSources(['/api/spells'], 'en'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.spellData).toHaveLength(1);
  });

  it('toggles refetching on subsequent requests', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });

    const { result, rerender } = renderHook(
      ({ filters }: { filters: Array<{ field: string; operator: string; value: string }> }) =>
        useSpellSources(['/api/spells'], 'en', undefined, undefined, filters as never),
      {
        wrapper,
        initialProps: { filters: [] },
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      rerender({ filters: [{ field: 'school', operator: 'eq', value: 'Evocation' }] });
    });

    await waitFor(() => expect(result.current.refetching).toBe(false));
  });
});
