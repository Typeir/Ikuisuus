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

import LabsDevPage, { generateMetadata } from '@/app/[locale]/labs/dev/page';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('LabsDevPage', () => {
  it('renders an empty canvas region', () => {
    render(<LabsDevPage />);

    const canvas = screen.getByTestId('labs-dev-canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas.childNodes).toHaveLength(0);
  });

  it('labels the route in the corner tag', () => {
    render(<LabsDevPage />);
    expect(screen.getByText('labs/dev')).toBeInTheDocument();
  });

  it('sets a page title', () => {
    expect(generateMetadata().title).toContain('Labs');
  });
});
