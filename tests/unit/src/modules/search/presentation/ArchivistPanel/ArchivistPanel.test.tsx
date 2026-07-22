/**
 * @fileoverview ArchivistPanel Unit Tests
 * @module tests/unit/src/modules/search/presentation/ArchivistPanel/ArchivistPanel
 */

import type { FeaturedPage } from '@/modules/search/domain/featuredPages';
import { ArchivistPanel } from '@/modules/search/presentation/ArchivistPanel/ArchivistPanel';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

const page: FeaturedPage = {
  title: 'Abominable Avian',
  path: 'monsters/abominable-avian',
  kind: 'monsters',
};

describe('ArchivistPanel', () => {
  it('should render the page title and an embed iframe', () => {
    render(<ArchivistPanel page={page} locale='en' />);
    expect(screen.getByText('Abominable Avian')).toBeTruthy();
    const iframe = screen.getByTitle('Preview: Abominable Avian');
    expect(iframe.getAttribute('src')).toBe(
      '/en/library/monsters/abominable-avian?embed=true',
    );
  });
});
