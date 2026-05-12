import { useContentShard, useShard } from '@/lib/hooks/data/useContentShard';
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

describe('useShard', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('returns shard text after loading', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ text: '## Heading\nBody text' }),
    });

    const { result } = renderHook(
      () =>
        useShard({
          sourceFile: 'bloodlines/crimson',
          heading: 'Boon Name',
          enabled: true,
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.text).toContain('Heading');
  });

  it('returns undefined when disabled', () => {
    const { result } = renderHook(
      () =>
        useShard({
          sourceFile: 'bloodlines/crimson',
          heading: 'Boon',
          enabled: false,
        }),
      { wrapper },
    );
    expect(result.current.data).toBeUndefined();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe('useContentShard', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('returns content shard map after loading', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ shards: { main: 'Main body' } }),
    });

    const { result } = renderHook(
      () =>
        useContentShard({
          contentType: 'feats',
          slug: 'iron-will',
          locale: 'en',
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.shards.main).toBe('Main body');
  });

  it('returns undefined when disabled', () => {
    const { result } = renderHook(
      () =>
        useContentShard({
          contentType: 'feats',
          slug: 'iron-will',
          locale: 'en',
          enabled: false,
        }),
      { wrapper },
    );
    expect(result.current.data).toBeUndefined();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
