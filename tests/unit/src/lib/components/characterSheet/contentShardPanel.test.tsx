/**
 * @fileoverview ContentShardPanel Unit Tests
 * @description Verifies fetch, render, loading, and error states for the
 * ContentShardPanel. All network and markdown rendering is mocked so tests
 * remain synchronous with respect to rendering.
 *
 * @module tests/unit/lib/components/characterSheet/contentShardPanel
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { ContentShardPanel } from '@/lib/components/characterSheet/contentShardPanel';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/md/renderMarkdownToHtml', () => ({
  renderMarkdownToHtml: (md: string) => Promise.resolve(`<p>${md}</p>`),
}));

const mockFetch = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();

beforeEach(() => {
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
    expect(screen.getByText('Loading…')).toBeTruthy();
  });

  it('renders the markdown returned from the API', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ shards: { main: 'You are always alert.' } }),
    );
    render(<ContentShardPanel contentType='feats' slug='alert' locale='en' />);

    await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull());

    expect(screen.getByText('You are always alert.')).toBeTruthy();
  });

  it('renders an error state when the API returns a non-ok status', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ error: 'not found' }, 404));
    render(<ContentShardPanel contentType='bloodlines' slug='missing' />);

    await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull());

    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('renders an error state when fetch rejects', async () => {
    mockFetch.mockRejectedValue(new Error('network error'));
    render(<ContentShardPanel contentType='vocations' slug='barbarian' />);

    await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull());

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText(/network error/i)).toBeTruthy();
  });

  it('fetches from the correct URL with the locale', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ shards: { main: '' } }));
    render(
      <ContentShardPanel
        contentType='specializations'
        slug='berserker'
        locale='es'
      />,
    );

    await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull());

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/content-shards/specializations/berserker?keys[]=main&locale=es',
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
      '/api/content-shards/feats/resilient?keys[]=main&locale=en',
    );
  });
});
