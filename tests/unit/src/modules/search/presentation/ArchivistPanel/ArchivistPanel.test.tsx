/**
 * @fileoverview ArchivistPanel Unit Tests
 * @module tests/unit/src/modules/search/presentation/ArchivistPanel/ArchivistPanel
 */

import type { FeaturedPage } from '@/modules/search/domain/featuredPages';
import { ArchivistPanel } from '@/modules/search/presentation/ArchivistPanel/ArchivistPanel';
import { fireEvent, render, screen } from '@testing-library/react';
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
      '/en/embed/monsters/abominable-avian',
    );
  });

  it('should render the header without an iframe while the pick is pending', () => {
    render(<ArchivistPanel page={null} locale='en' />);
    expect(screen.getByText('archivistReading')).toBeTruthy();
    expect(screen.queryByTitle(/^Preview:/)).toBeNull();
  });

  it('should announce loading until the embed reports load', () => {
    render(<ArchivistPanel page={page} locale='en' />);
    expect(screen.getByRole('status').textContent).toBe('archivistLoading');

    fireEvent.load(screen.getByTitle('Preview: Abominable Avian'));
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('should re-announce loading when the pick changes', () => {
    const { rerender } = render(<ArchivistPanel page={page} locale='en' />);
    fireEvent.load(screen.getByTitle('Preview: Abominable Avian'));
    expect(screen.queryByRole('status')).toBeNull();

    const next: FeaturedPage = {
      title: 'Heart of the Brume',
      path: 'monsters/heart-of-the-brume',
      kind: 'monsters',
    };
    rerender(<ArchivistPanel page={next} locale='en' />);
    expect(screen.getByRole('status').textContent).toBe('archivistLoading');
  });
});
