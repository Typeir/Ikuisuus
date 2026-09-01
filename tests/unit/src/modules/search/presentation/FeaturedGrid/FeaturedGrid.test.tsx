/**
 * @fileoverview FeaturedGrid Unit Tests
 * @description Renders the discovery grid with a mocked /api/discovery fetch.
 *
 * @module tests/unit/src/modules/search/presentation/FeaturedGrid/FeaturedGrid.test
 */

import { FeaturedGrid } from '@/modules/search/presentation/FeaturedGrid/FeaturedGrid';
import { fetcher } from '@/lib/fetch/fetcher';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/fetch/fetcher', () => ({
  fetcher: vi.fn(),
}));

const mockedFetcher = vi.mocked(fetcher);

describe('FeaturedGrid', () => {
  beforeEach(() => {
    mockedFetcher.mockReset();
  });

  it('should render the heading and a card for each fetched entry', async () => {
    mockedFetcher.mockResolvedValue({
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
    });

    render(<FeaturedGrid locale='en' />);

    /* Global next-intl mock renders translation keys verbatim. */
    expect(screen.getByText('featuredHeading')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('Ancient Dragon')).toBeTruthy());
  });

  it('should render the empty state when the fetch fails', async () => {
    mockedFetcher.mockRejectedValue(new Error('offline'));

    render(<FeaturedGrid locale='en' />);

    await waitFor(() => expect(screen.getByText('featuredEmpty')).toBeTruthy());
  });
});
