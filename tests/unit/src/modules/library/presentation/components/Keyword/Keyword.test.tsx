/**
 * @fileoverview Keyword MDX Component Tests
 * @description Tests that the Keyword component renders the display text,
 * links to the defining rule page, shows its blurb in the hover tooltip, and
 * degrades to plain text for unregistered terms.
 *
 * @module tests/unit/modules/library/presentation/components/Keyword
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-19
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react Rendering utilities
 */

import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dom')>();
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}));

import Keyword from '@/modules/library/presentation/components/Keyword/Keyword';

describe('Keyword', () => {
  describe('rendering', () => {
    it('should render the term as the label', () => {
      render(<Keyword term='accuracy' />);
      expect(screen.getByRole('link')).toHaveTextContent('accuracy');
    });

    it('should prefer the display text when given', () => {
      render(<Keyword term='briefly' display='Briefly' />);
      expect(screen.getByRole('link')).toHaveTextContent('Briefly');
    });

    it('should expose the canonical term as a data attribute', () => {
      render(<Keyword term='damage bonus' />);
      expect(screen.getByRole('link')).toHaveAttribute(
        'data-keyword',
        'damage bonus',
      );
    });
  });

  describe('linking', () => {
    it('should link to the defining rule page', () => {
      render(<Keyword term='briefly' />);
      expect(screen.getByRole('link')).toHaveAttribute(
        'href',
        '/en/library/rules/steel-and-strife/effects-and-enhancements',
      );
    });

    it('should render a span instead of a link with noLink', () => {
      render(<Keyword term='accuracy' noLink />);
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.getByText('accuracy')).toHaveAttribute(
        'data-keyword',
        'accuracy',
      );
    });
  });

  describe('hover definition', () => {
    it('should show the blurb in the tooltip on hover', () => {
      vi.useFakeTimers();
      try {
        render(<Keyword term='damage bonus' />);

        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

        fireEvent.mouseEnter(screen.getByRole('link'));
        act(() => {
          vi.advanceTimersByTime(300);
        });

        expect(screen.getByRole('tooltip')).toHaveTextContent(
          'keyed ability alone',
        );
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('unregistered terms', () => {
    it('should degrade to a plain span', () => {
      render(<Keyword term='swiftness' />);
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.getByText('swiftness')).not.toHaveAttribute('data-keyword');
    });

    it('should still honour display text when degrading', () => {
      render(<Keyword term='swiftness' display='Swiftness' />);
      expect(screen.getByText('Swiftness')).toBeInTheDocument();
    });
  });
});
