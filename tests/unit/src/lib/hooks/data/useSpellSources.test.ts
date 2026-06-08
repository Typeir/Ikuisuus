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

  it('should load spell data from source endpoints', async () => {
    const sources = ['/api/spells/list'];

    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            slug: 'fireball',
            title: 'Fireball',
            level: 3,
            school: 'Evocation',
            castingTime: ['action'],
            castingTimeRaw: '1 action',
            range: '150 feet',
            duration: 'Instantaneous',
            verbal: true,
            somatic: true,
            material: false,
            concentration: false,
          },
        ]),
    });

    const { result } = renderHook(() => useSpellSources(sources, 'en'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.refetching).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.spellData).toHaveLength(1);
    expect(result.current.spellData[0].slug).toBe('fireball');
  });

  it('should expose error when source request fails', async () => {
    const sources = ['/api/spells/list'];

    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    });

    const { result } = renderHook(() => useSpellSources(sources, 'en'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.spellData).toEqual([]);
    expect(result.current.error).toContain('HTTP 500');
  });

  it('should forward filters to the POST body', async () => {
    const sources = ['/api/spells/list'];
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });

    const filters = [
      { field: 'source', operator: 'neq', value: 'basic' } as const,
    ];

    const { result } = renderHook(
      () => useSpellSources(sources, 'en', undefined, undefined, filters),
      { wrapper },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFetch).toHaveBeenCalledWith('/api/spells/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: 'en', filters }),
    });
  });

  it('should refetch when filter expressions change', async () => {
    const sources = ['/api/spells/list'];
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });

    const initialFilters = [
      { field: 'source', operator: 'neq', value: 'basic' } as const,
    ];
    const updatedFilters = [
      { field: 'school', operator: 'eq', value: 'Evocation' } as const,
    ];

    const { rerender, result } = renderHook(
      ({ filters }: { filters: typeof initialFilters }) =>
        useSpellSources(sources, 'en', undefined, undefined, filters),
      { initialProps: { filters: initialFilters }, wrapper },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFetch).toHaveBeenCalledTimes(1);

    rerender({ filters: updatedFilters as never });

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
  });

  it('should not set loading to true on re-fetch after initial load', async () => {
    const sources = ['/api/spells/list'];
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });

    const { rerender, result } = renderHook(
      ({ filterKey }: { filterKey: string }) =>
        useSpellSources(
          sources,
          'en',
          undefined,
          undefined,
          filterKey
            ? [{ field: 'source', operator: 'neq', value: filterKey }]
            : [],
        ),
      { initialProps: { filterKey: '' }, wrapper },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      rerender({ filterKey: 'basic' });
    });
    await waitFor(() => expect(result.current.refetching).toBe(false));

    expect(result.current.loading).toBe(false);
  });
});
