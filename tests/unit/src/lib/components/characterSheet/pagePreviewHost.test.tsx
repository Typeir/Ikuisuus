/**
 * @fileoverview Page Preview Host Tests
 * @description Verifies that the host renders one iframe per open preview.
 *
 * @module tests/unit/src/lib/components/characterSheet/pagePreviewHost.test
 */

import { PagePreviewHost } from '@/lib/components/characterSheet/pagePreviewHost';
import {
    PagePreviewProvider,
    usePagePreview,
} from '@/lib/components/characterSheet/pagePreviewProvider';
import { act, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { describe, expect, it } from 'vitest';

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
          <PagePreviewHost locale='en' />
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
