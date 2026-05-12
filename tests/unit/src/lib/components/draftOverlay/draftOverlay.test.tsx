/**
 * DraftOverlay Component Unit Tests
 *
 * @fileoverview Tests for the draft content overlay. Verifies fetch behavior,
 * loading states, client-side MDX compilation, rendering of draft content
 * over static children, and the toggle button that slides the draft panel.
 *
 * @module tests/unit/lib/components/draftOverlay/draftOverlay
 */

import DraftOverlay from '@/lib/components/draftOverlay/draftOverlay';
import { render as baseRender, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockEvaluate = vi.fn();

vi.mock('@mdx-js/mdx', () => ({
  evaluate: (...args: unknown[]) => mockEvaluate(...args),
}));

vi.mock('remark-gfm', () => ({ default: () => {} }));

const mockDraft = {
  id: 1,
  locale: 'en',
  slug: 'monsters/albedo',
  content: '# Albedo\n\nDraft content here.',
  status: 'active',
  createdAt: '2026-03-12T00:00:00.000Z',
  updatedAt: '2026-03-12T01:00:00.000Z',
};

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
  vi.stubGlobal('fetch', vi.fn());
  mockEvaluate.mockResolvedValue({
    default: () => React.createElement('div', null, 'Compiled MDX Content'),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DraftOverlay', () => {
  it('should render children while loading', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}));

    render(
      <DraftOverlay locale='en' slug='monsters/albedo'>
        <p>Static content</p>
      </DraftOverlay>,
    );

    expect(screen.getByText('Static content')).toBeInTheDocument();
  });

  it('should render only children when no draft is found (404)', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: 'Not found' }), { status: 404 }),
    );

    render(
      <DraftOverlay locale='en' slug='nonexistent'>
        <p>Static content</p>
      </DraftOverlay>,
    );

    await waitFor(() => {
      expect(screen.getByText('Static content')).toBeInTheDocument();
    });
    expect(screen.queryByText('Draft')).not.toBeInTheDocument();
  });

  it('should render compiled MDX draft content over children', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ draft: mockDraft }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    render(
      <DraftOverlay locale='en' slug='monsters/albedo'>
        <p>Static content</p>
      </DraftOverlay>,
    );

    await waitFor(() => {
      expect(screen.getByText('Draft')).toBeInTheDocument();
    });

    expect(screen.getByText('Compiled MDX Content')).toBeInTheDocument();
    expect(screen.getByText('Static content')).toBeInTheDocument();
    expect(mockEvaluate).toHaveBeenCalledWith(
      mockDraft.content,
      expect.objectContaining({ useMDXComponents: expect.any(Function) }),
    );
  });

  it('should toggle between draft and published views', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ draft: mockDraft }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    render(
      <DraftOverlay locale='en' slug='monsters/albedo'>
        <p>Static content</p>
      </DraftOverlay>,
    );

    await waitFor(() => {
      expect(screen.getByText('View Published')).toBeInTheDocument();
    });

    const panel = screen
      .getByText('Compiled MDX Content')
      .closest('[class*="draftPanel"]')!;
    expect(panel).not.toHaveAttribute('aria-hidden', 'true');

    const user = userEvent.setup();
    await user.click(screen.getByText('View Published'));

    expect(panel).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('View Draft')).toBeInTheDocument();

    await user.click(screen.getByText('View Draft'));

    expect(panel).not.toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('View Published')).toBeInTheDocument();
  });

  it('should call the correct API URL with encoded params', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ draft: null }), { status: 404 }),
    );

    render(
      <DraftOverlay locale='en' slug='items/heirlooms/sacred-heresy'>
        <p>Static content</p>
      </DraftOverlay>,
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/drafts?locale=en&slug=items%2Fheirlooms%2Fsacred-heresy',
      );
    });
  });

  it('should render only children when fetch throws a network error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

    render(
      <DraftOverlay locale='en' slug='test'>
        <p>Static content</p>
      </DraftOverlay>,
    );

    await waitFor(() => {
      expect(screen.getByText('Static content')).toBeInTheDocument();
    });
    expect(screen.queryByText('Draft')).not.toBeInTheDocument();
  });

  it('should not show toggle button when no draft exists', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: 'Not found' }), { status: 404 }),
    );

    render(
      <DraftOverlay locale='en' slug='test'>
        <p>Static content</p>
      </DraftOverlay>,
    );

    await waitFor(() => {
      expect(screen.getByText('Static content')).toBeInTheDocument();
    });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should fall back to raw content when MDX compilation fails', async () => {
    mockEvaluate.mockRejectedValue(new Error('Unexpected token'));

    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ draft: mockDraft }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    render(
      <DraftOverlay locale='en' slug='monsters/albedo'>
        <p>Static content</p>
      </DraftOverlay>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('draft-fallback')).toBeInTheDocument();
    });

    expect(screen.getByTestId('draft-fallback').textContent).toContain(
      'MDX compilation failed',
    );
    expect(screen.getByTestId('draft-fallback').textContent).toContain(
      'Albedo',
    );
  });
});
