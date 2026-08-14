/**
 * @fileoverview Page Preview Host Tests
 * @description Verifies the host renders one iframe per open preview.
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

/** Stub for `POST /api/resolve-preview-path`, returning the app's resolved path. */
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
 * Opens a preview during render.
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
      '/en/embed/character-creation/feats/tough',
    );
  });
});
