/**
 * @fileoverview FeaturedGrid Unit Tests
 * @description Renders the discovery grid with a mocked /api/discovery fetch.
 *
 * @module tests/unit/src/modules/search/presentation/FeaturedGrid/FeaturedGrid
 */

import { FeaturedGrid } from '@/modules/search/presentation/FeaturedGrid/FeaturedGrid';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('FeaturedGrid', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should render the heading and a card for each fetched entry', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          entries: {
            monsters: {
              featured: {
                slug: 'dragon',
                title: 'Ancient Dragon',
                link: '/library/monsters/dragon',
                description: 'A test creature.',
              },
              random: null,
            },
          },
        }),
      }),
    );

    render(<FeaturedGrid locale='en' />);

    /* Global next-intl mock renders translation keys verbatim. */
    expect(screen.getByText('featuredHeading')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('Ancient Dragon')).toBeTruthy());
  });

  it('should render the empty state when the fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    render(<FeaturedGrid locale='en' />);

    await waitFor(() => expect(screen.getByText('featuredEmpty')).toBeTruthy());
  });
});
