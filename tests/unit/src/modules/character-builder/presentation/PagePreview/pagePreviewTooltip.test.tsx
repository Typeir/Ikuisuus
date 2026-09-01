/**
 * @fileoverview Page Preview Tooltip Tests
 * @description Verifies the tooltip toggle interaction with the surrounding
 * provider state.
 *
 * @module tests/unit/src/modules/character-builder/presentation/PagePreview/pagePreviewTooltip.test
 */

import { PagePreviewProvider } from '@/modules/character-builder/presentation/PagePreview/pagePreviewProvider';
import { PagePreviewTooltip } from '@/modules/character-builder/presentation/PagePreview/pagePreviewTooltip';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('PagePreviewTooltip', () => {
  it('toggles aria-pressed on click', () => {
    render(
      <PagePreviewProvider>
        <PagePreviewTooltip
          kind='bloodlines'
          slug='bilupine'
          title='Bilupine'
        />
      </PagePreviewProvider>,
    );
    const btn = screen.getByRole('button', { name: 'Preview Bilupine' });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });
});
