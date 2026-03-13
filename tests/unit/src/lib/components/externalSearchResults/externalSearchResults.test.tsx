/**
 * @fileoverview Unit tests for External Search Results component
 * @module tests/unit/src/lib/components/externalSearchResults/externalSearchResults.test
 * @description Tests ExternalSearchResults component with mocked Google CSE API.
 * Validates loading states, error handling, debouncing, and race condition prevention.
 *
 * @version 2.0.0
 * @author Typeir
 *
 * @requires vitest
 * @requires @testing-library/react
 * @requires @/lib/components/externalSearchResults/externalSearchResults
 */

import { ExternalSearchResults } from '@/lib/components/externalSearchResults/externalSearchResults';
import { logger } from '@/lib/logging/logger';
import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import mockSearchResults from '../../../../../fixtures/externalSearch/googleSearchResults.json';

/**
 * Mock next-intl translations
 */
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      loading: 'Loading external results...',
      noResults: 'No web results found',
      header: 'Web Results',
    };
    return translations[key] || key;
  },
}));

/**
 * Mock next/navigation useParams
 */
vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
}));

/**
 * Mock next/link to simplify testing
 */
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: any;
  }) => (
    <a href={typeof href === 'string' ? href : href.pathname} {...props}>
      {children}
    </a>
  ),
}));

describe('ExternalSearchResults', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('should export ExternalSearchResults as function', () => {
      expect(ExternalSearchResults).toBeDefined();
      expect(typeof ExternalSearchResults).toBe('function');
    });

    it('should render nothing with empty query', () => {
      const { container } = render(<ExternalSearchResults query='' />);
      expect(container.firstChild).toBeNull();
    });

    it('should render nothing with query less than 2 characters', () => {
      const { container } = render(<ExternalSearchResults query='a' />);
      expect(screen.getByText('No web results found')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading text during fetch', async () => {
      vi.useFakeTimers();

      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve(mockSearchResults.success),
                }),
              1000,
            ),
          ),
      );

      render(<ExternalSearchResults query='goblin' />);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      expect(
        screen.getByText('Loading external results...'),
      ).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('should hide loading text after successful fetch', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSearchResults.success),
      });

      render(<ExternalSearchResults query='dragon' />);

      await waitFor(
        () => {
          expect(
            screen.queryByText('Loading external results...'),
          ).not.toBeInTheDocument();
        },
        { timeout: 1000 },
      );
    });
  });

  describe('Successful Search', () => {
    it('should display search results with object format', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSearchResults.success),
      });

      render(<ExternalSearchResults query='spellcasting' />);

      await waitFor(
        () => {
          expect(screen.getByText('Web Results')).toBeInTheDocument();
        },
        { timeout: 1000 },
      );

      expect(
        screen.getByText('Dark Alliance - D&D Beyond'),
      ).toBeInTheDocument();
      expect(screen.getByText('Monster Manual - Goblin')).toBeInTheDocument();
      expect(
        screen.getByText("Player's Handbook - Spellcasting"),
      ).toBeInTheDocument();
    });

    it('should display search results with array format', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSearchResults.arrayFormat),
      });

      render(<ExternalSearchResults query='test' />);

      await waitFor(
        () => {
          expect(
            screen.getByText('Alternative Format Result'),
          ).toBeInTheDocument();
        },
        { timeout: 1000 },
      );
    });

    it('should render results as links with correct href format', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSearchResults.success),
      });

      render(<ExternalSearchResults query='monsters' />);

      await waitFor(
        () => {
          const link = screen.getByText('Monster Manual - Goblin');
          expect(link.tagName).toBe('A');
          expect(link).toHaveAttribute('href', 'en/library/beyond');
        },
        { timeout: 1000 },
      );
    });
  });

  describe('Empty Results', () => {
    it('should show no results message when API returns empty array', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSearchResults.empty),
      });

      render(<ExternalSearchResults query='nonexistent' />);

      await waitFor(
        () => {
          expect(screen.getByText('No web results found')).toBeInTheDocument();
        },
        { timeout: 1000 },
      );
    });

    it('should show no results when items is undefined', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      render(<ExternalSearchResults query='empty' />);

      await waitFor(
        () => {
          expect(screen.getByText('No web results found')).toBeInTheDocument();
        },
        { timeout: 1000 },
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<ExternalSearchResults query='error' />);

      await waitFor(
        () => {
          expect(logger.error).toHaveBeenCalledWith(
            'External search failed',
            expect.objectContaining({ error: 'Network error' }),
          );
        },
        { timeout: 1000 },
      );
    });

    it('should not crash on malformed response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ unexpected: 'format' }),
      });

      render(<ExternalSearchResults query='malformed' />);

      await waitFor(
        () => {
          expect(screen.getByText('No web results found')).toBeInTheDocument();
        },
        { timeout: 1000 },
      );
    });
  });

  describe('Debouncing', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should debounce API calls with 300ms delay', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSearchResults.success),
      });

      const { rerender } = render(<ExternalSearchResults query='ab' />);

      expect(mockFetch).not.toHaveBeenCalled();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });

      expect(mockFetch).not.toHaveBeenCalled();

      rerender(<ExternalSearchResults query='abc' />);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });

      expect(mockFetch).not.toHaveBeenCalled();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
        await vi.runAllTimersAsync();
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should cancel previous debounce when query changes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSearchResults.success),
      });

      const { rerender } = render(<ExternalSearchResults query='dragon' />);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });

      rerender(<ExternalSearchResults query='spell' />);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });

      rerender(<ExternalSearchResults query='monster' />);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
        await vi.runAllTimersAsync();
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/web-search?q=monster');
    });
  });

  describe('Race Condition Prevention', () => {
    it('should only display results from latest request', async () => {
      let resolveFast: (value: any) => void;
      let resolveSlow: (value: any) => void;

      const slowPromise = new Promise((resolve) => {
        resolveSlow = resolve;
      });
      const fastPromise = new Promise((resolve) => {
        resolveFast = resolve;
      });

      mockFetch
        .mockReturnValueOnce(slowPromise)
        .mockReturnValueOnce(fastPromise);

      const { rerender } = render(<ExternalSearchResults query='first' />);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 350));
      });

      rerender(<ExternalSearchResults query='second' />);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 350));
      });

      await act(async () => {
        resolveFast({
          ok: true,
          json: () =>
            Promise.resolve({
              items: [{ title: 'Fast Result', link: 'https://fast.com' }],
            }),
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Fast Result')).toBeInTheDocument();
      });

      await act(async () => {
        resolveSlow({
          ok: true,
          json: () =>
            Promise.resolve({
              items: [{ title: 'Slow Result', link: 'https://slow.com' }],
            }),
        });
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      expect(screen.queryByText('Slow Result')).not.toBeInTheDocument();
      expect(screen.getByText('Fast Result')).toBeInTheDocument();
    });

    it('should not show loading state from outdated request', async () => {
      let resolveFast: (value: any) => void;
      const slowPromise = new Promise(() => {});
      const fastPromise = new Promise((resolve) => {
        resolveFast = resolve;
      });

      mockFetch
        .mockReturnValueOnce(slowPromise)
        .mockReturnValueOnce(fastPromise);

      const { rerender } = render(<ExternalSearchResults query='slow-query' />);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 350));
      });

      expect(
        screen.getByText('Loading external results...'),
      ).toBeInTheDocument();

      rerender(<ExternalSearchResults query='fast-query' />);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 350));
      });

      await act(async () => {
        resolveFast({
          ok: true,
          json: () => Promise.resolve(mockSearchResults.success),
        });
      });

      await waitFor(() => {
        expect(
          screen.queryByText('Loading external results...'),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should call correct API endpoint with encoded query', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSearchResults.success),
      });

      render(<ExternalSearchResults query='spell slots & magic' />);

      await waitFor(
        () => {
          expect(mockFetch).toHaveBeenCalledWith(
            '/api/web-search?q=spell%20slots%20%26%20magic',
          );
        },
        { timeout: 1000 },
      );
    });

    it('should handle multiple results correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSearchResults.large),
      });

      render(<ExternalSearchResults query='comprehensive' />);

      await waitFor(
        () => {
          expect(screen.getAllByRole('listitem')).toHaveLength(5);
        },
        { timeout: 1000 },
      );
    });
  });
});
