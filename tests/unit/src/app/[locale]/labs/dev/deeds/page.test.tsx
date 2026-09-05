/**
 * @fileoverview Tests for the deed-costed monster preview page.
 *
 * @module tests/unit/src/app/[locale]/labs/dev/deeds/page.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-05
 */

import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/app/[locale]/labs/dev/slots/SlotsPreview', () => ({
  SlotsPreview: ({ fixture }: { fixture?: string }) => (
    <div data-testid='slots-preview' data-fixture={fixture ?? 'alfanjon.mdx'} />
  ),
}));

import DeedsLabsPage, {
  generateMetadata,
} from '@/app/[locale]/labs/dev/deeds/page';

describe('deeds labs page', () => {
  it('renders the deed-costed monster fixture', () => {
    const { getByTestId } = render(<DeedsLabsPage />);
    expect(getByTestId('slots-preview').getAttribute('data-fixture')).toBe(
      'monster-deeds.mdx',
    );
  });

  it('keeps the labs route out of search engines', () => {
    expect(generateMetadata().robots).toEqual({ index: false, follow: false });
  });

  it('titles the page for the labs route', () => {
    expect(generateMetadata().title).toContain('deeds');
  });
});
