/**
 * @fileoverview Unit tests for the labs dev canvas page.
 * @description Verifies the page renders an empty canvas region and a title.
 *
 * @module tests/unit/src/app/[locale]/labs/dev/page.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires @/app/[locale]/labs/dev/page
 */

import { describe, expect, it, vi } from 'vitest';

vi.mock('@/app/[locale]/labs/dev/slots/SlotsPreview', () => ({
  SlotsPreview: () => <div data-testid='slots-preview' />,
}));

import LabsDevPage, { generateMetadata } from '@/app/[locale]/labs/dev/page';
import { render, screen } from '@testing-library/react';

describe('LabsDevPage', () => {
  it('mounts the slot card preview on the canvas', () => {
    render(<LabsDevPage />);

    const canvas = screen.getByTestId('labs-dev-canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas.childNodes).toHaveLength(1);
    expect(screen.getByTestId('slots-preview')).toBeInTheDocument();
  });

  it('labels the route in the corner tag', () => {
    render(<LabsDevPage />);
    expect(screen.getByText('labs/dev')).toBeInTheDocument();
  });

  it('sets a page title', () => {
    expect(generateMetadata().title).toContain('Labs');
  });
});
