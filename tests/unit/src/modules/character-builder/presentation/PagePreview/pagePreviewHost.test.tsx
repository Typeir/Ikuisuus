/**
 * @fileoverview Page Preview Host Tests
 * @description Verifies the host renders one iframe per open preview.
 * @module tests/unit/src/modules/character-builder/presentation/PagePreview/pagePreviewHost.test
 */

import { PagePreviewHost } from '@/modules/character-builder/presentation/PagePreview/pagePreviewHost';
import {
    PagePreviewProvider,
    usePagePreview,
} from '@/modules/character-builder/presentation/PagePreview/pagePreviewProvider';
import { act, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/fetch/fetcher', () => ({
  fetcher: vi.fn(),
}));

import { fetcher } from '@/lib/fetch/fetcher';

const mockFetch = vi.mocked(fetcher);

beforeEach(() => {
  mockFetch.mockResolvedValue({ path: 'character-creation/feats/tough' });
});

afterEach(() => {
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
