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
  CONTENT_V2_FIXTURES: ['spell.mdx', 'trinket.mdx', 'monster.mdx'],
  SlotsPreview: ({ fixture }: { fixture?: string }) => (
    <div data-testid='slots-preview' data-fixture={fixture ?? 'alfanjon.mdx'} />
  ),
}));

import SlotsLabsPage, {
  generateMetadata,
} from '@/app/[locale]/labs/dev/slots/page';

describe('slots labs page', () => {
  it('renders the heirloom fixture and every content-v2 fixture', () => {
    const { getAllByTestId } = render(<SlotsLabsPage />);
    const previews = getAllByTestId('slots-preview');
    expect(previews.map((node) => node.getAttribute('data-fixture'))).toEqual([
      'alfanjon.mdx',
      'spell.mdx',
      'trinket.mdx',
      'monster.mdx',
    ]);
  });

  it('keeps the labs route out of search engines', () => {
    const metadata = generateMetadata();
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it('titles the page for the labs route', () => {
    expect(generateMetadata().title).toContain('slots');
  });
});
