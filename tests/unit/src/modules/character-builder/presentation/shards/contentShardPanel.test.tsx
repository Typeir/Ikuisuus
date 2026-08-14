/**
 * @fileoverview ContentShardPanel Unit Tests
 * @description Mocks ContentShardPanel fetch, MDX compilation, and markdown
 * rendering to verify its fetch, render, loading, error, and MDX fallback states.
 *
 * @module tests/unit/lib/components/characterSheet/contentShardPanel
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { ContentShardPanel } from '@/modules/character-builder/presentation/shards/contentShardPanel';
import { compileRuntimeSync } from '@/modules/library/infrastructure/compile/compileRuntime';
import { render as baseRender, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/md/renderMarkdownToHtml', () => ({
  renderMarkdownToHtml: (md: string) => Promise.resolve(`<p>${md}</p>`),
}));

vi.mock('@/modules/library/infrastructure/compile/compileRuntime', () => ({
  compileRuntimeSync: vi.fn(({ source }: { source: string }) => ({
    content: source,
  })),
}));

vi.mock('@/modules/library/presentation/components', () => ({
  default: {},
}));

const mockFetch = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();

let swrCache: Map<unknown, unknown>;
const SWRWrapper = ({ children }: { children: React.ReactNode }) => (
  <SWRConfig value={{ provider: () => swrCache, dedupingInterval: 0 }}>
    {children}
  </SWRConfig>
);
const render = (ui: React.ReactElement) =>
  baseRender(ui, { wrapper: SWRWrapper });

beforeEach(() => {
  swrCache = new Map();
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
  mockFetch.mockReset();
});

/**
 * Builds a minimal Response-like object for fetch mock.
 *
 * @param {unknown} body - JSON body
 * @param {number} status - HTTP status
 * @returns {Response} Mock Response
 */
const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status });

describe('ContentShardPanel', () => {
  it('shows loading state immediately on mount', () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<ContentShardPanel contentType='feats' slug='alert' />);
    expect(
      document.querySelectorAll('[class*="skeleton"]').length,
    ).toBeGreaterThan(0);
  });

  it('renders the markdown returned from the API', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ shards: { main: 'You are always alert.' } }),
    );
    render(<ContentShardPanel contentType='feats' slug='alert' />);

    await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull());

    expect(screen.getByText('You are always alert.')).toBeTruthy();
  });

  it('falls back to plain HTML when MDX compilation fails', async () => {
    vi.mocked(compileRuntimeSync).mockImplementationOnce(() => {
      throw new Error('MDX compile error');
    });
    mockFetch.mockResolvedValue(
      jsonResponse({ shards: { main: 'Fallback content.' } }),
    );
    render(<ContentShardPanel contentType='feats' slug='alert' />);

    await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull());

    await waitFor(() =>
      expect(screen.getByText('Fallback content.')).toBeTruthy(),
    );
  });

  it('renders an error state when the API returns a non-ok status', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ error: 'not found' }, 404));
    render(<ContentShardPanel contentType='bloodlines' slug='missing' />);

    await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull());

    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('renders an error state when fetch rejects', async () => {
    mockFetch.mockRejectedValue(new Error('network error'));
    render(<ContentShardPanel contentType='vocations' slug='Berserker' />);

    await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull());

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText(/network error/i)).toBeTruthy();
  });

  it('fetches from the correct URL with the locale', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ shards: { main: '' } }));
    render(
      <ContentShardPanel contentType='specializations' slug='berserker' />,
    );

    await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull());

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/content-shards/specializations/berserker?locale=en',
    );
  });

  it('re-fetches when slug changes', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ shards: { main: 'Content' } }));
    const { rerender } = render(
      <ContentShardPanel contentType='feats' slug='alert' />,
    );

    await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull());
    expect(mockFetch).toHaveBeenCalledTimes(1);

    rerender(<ContentShardPanel contentType='feats' slug='resilient' />);

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    expect(mockFetch).toHaveBeenLastCalledWith(
      '/api/content-shards/feats/resilient?locale=en',
    );
  });
});
