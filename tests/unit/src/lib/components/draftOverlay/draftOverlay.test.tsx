/**
 * DraftOverlay Component Unit Tests
 *
 * @fileoverview Tests for the draft content overlay. Verifies fetch behavior,
 * loading states, and rendering of draft content with the banner.
 *
 * @module tests/unit/lib/components/draftOverlay/draftOverlay
 */

import DraftOverlay from '@/lib/components/draftOverlay/draftOverlay';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockDraft = {
  id: 1,
  locale: 'en',
  slug: 'monsters/albedo',
  content: '# Albedo\n\nDraft content here.',
  status: 'active',
  createdAt: '2026-03-12T00:00:00.000Z',
  updatedAt: '2026-03-12T01:00:00.000Z',
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DraftOverlay', () => {
  it('should render nothing while loading', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}));

    const { container } = render(
      <DraftOverlay locale='en' slug='monsters/albedo' />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when no draft is found (404)', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: 'Not found' }), { status: 404 }),
    );

    const { container } = render(
      <DraftOverlay locale='en' slug='nonexistent' />,
    );

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('should render draft content with DraftBanner when draft exists', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ draft: mockDraft }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    render(<DraftOverlay locale='en' slug='monsters/albedo' />);

    await waitFor(() => {
      expect(screen.getByText('Draft')).toBeInTheDocument();
    });

    const pre = screen.getByText(/Albedo/);
    expect(pre).toBeInTheDocument();
    expect(pre.textContent).toContain('Draft content here.');
  });

  it('should call the correct API URL with encoded params', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ draft: null }), { status: 404 }),
    );

    render(<DraftOverlay locale='en' slug='items/heirlooms/sacred-heresy' />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/drafts?locale=en&slug=items%2Fheirlooms%2Fsacred-heresy',
      );
    });
  });

  it('should render nothing when fetch throws a network error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

    const { container } = render(<DraftOverlay locale='en' slug='test' />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });
});
