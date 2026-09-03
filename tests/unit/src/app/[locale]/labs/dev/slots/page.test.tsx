/**
 * @fileoverview Tests for the slot card fixture preview page.
 *
 * @module tests/unit/src/app/[locale]/labs/dev/slots/page.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-03
 */

import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/app/[locale]/labs/dev/slots/SlotsPreview', () => ({
  SlotsPreview: () => <div data-testid='slots-preview' />,
}));

import SlotsLabsPage, {
  generateMetadata,
} from '@/app/[locale]/labs/dev/slots/page';

describe('slots labs page', () => {
  it('renders the fixture preview', () => {
    const { getByTestId } = render(<SlotsLabsPage />);
    expect(getByTestId('slots-preview')).toBeInTheDocument();
  });

  it('keeps the labs route out of search engines', () => {
    const metadata = generateMetadata();
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it('titles the page for the labs route', () => {
    expect(generateMetadata().title).toContain('slots');
  });
});
