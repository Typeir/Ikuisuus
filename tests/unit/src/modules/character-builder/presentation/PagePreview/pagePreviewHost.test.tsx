/**
 * @fileoverview Page Preview Host Tests
 * @description Verifies that the host renders one iframe per open preview.
 *
 * @module tests/unit/src/lib/components/characterSheet/pagePreviewHost.test
 */

import { PagePreviewHost } from '@/modules/character-builder/presentation/PagePreview/pagePreviewHost';
import {
    PagePreviewProvider,
    usePagePreview,
} from '@/modules/character-builder/presentation/PagePreview/pagePreviewProvider';
import { act, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The host resolves each preview's content path through
 * `POST /api/resolve-preview-path`. jsdom cannot fetch a relative URL, so the
 * endpoint is stubbed with the path the component would receive in the app.
 */
const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  mockFetch.mockResolvedValue(
    new Response(JSON.stringify({ path: 'character-creation/feats/tough' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

/**
 * Helper that opens a preview during render so the host has something to draw.
 *
 * @function Opener
 * @returns {null} No DOM output
 */
function Opener(): null {
  const { open } = usePagePreview();
  useEffect(() => {
    open({ kind: 'feats', slug: 'tough', title: 'Tough' });
  }, [open]);
  return null;
}

describe('PagePreviewHost', () => {
  it('renders an iframe for each open preview entry with embed parameter', async () => {
    await act(async () => {
      render(
        <PagePreviewProvider>
          <Opener />
          <PagePreviewHost />
        </PagePreviewProvider>,
      );
    });
    const frames = screen.getAllByTitle('Tough');
    expect(frames.length).toBeGreaterThanOrEqual(1);
    expect(frames[0]).toHaveAttribute(
      'src',
      '/en/library/character-creation/feats/tough?embed=true',
    );
  });
});
