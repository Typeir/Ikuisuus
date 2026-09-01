/**
 * @fileoverview Keyword MDX Component Tests
 * @description Tests that the Keyword component renders the display text, links
 * to the route resolved for it at compile time, shows its shard in the hover
 * card, and degrades to plain text when the index resolved nothing.
 *
 * @module tests/unit/src/modules/library/presentation/components/Keyword/Keyword.test
 * @version 2.0.0
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
  useTranslations: () => (key: string, values?: Record<string, string>) =>
    values ? `${key}:${Object.values(values).join(',')}` : key,
}));

import { KeywordShardProvider } from '@/modules/library/presentation/components/Keyword/KeywordShardContext';
import Keyword from '@/modules/library/presentation/components/Keyword/Keyword';

/** Route the compile step resolves for `damage bonus`, minus the locale. */
const DAMAGE_BONUS_HREF =
  'library/rules/steel-and-strife/making-an-attack#damage-bonus';

/** Route the compile step resolves for `briefly`, minus the locale. */
const BRIEFLY_HREF =
  'library/rules/steel-and-strife/effects-and-enhancements#briefly';

describe('Keyword', () => {
  describe('rendering', () => {
    it('should render the term as the label', () => {
      render(<Keyword term='accuracy' href='library/rules/x#accuracy' />);
      expect(screen.getByRole('link')).toHaveTextContent('accuracy');
    });

    it('should prefer the display text when given', () => {
      render(
        <Keyword term='briefly' display='Briefly' href={BRIEFLY_HREF} />,
      );
      expect(screen.getByRole('link')).toHaveTextContent('Briefly');
    });

    it('should expose the canonical term as a data attribute', () => {
      render(<Keyword term='damage bonus' href={DAMAGE_BONUS_HREF} />);
      expect(screen.getByRole('link')).toHaveAttribute(
        'data-keyword',
        'damage bonus',
      );
    });
  });

  describe('linking', () => {
    it('should link to the route resolved at compile time', () => {
      render(<Keyword term='briefly' href={BRIEFLY_HREF} />);
      expect(screen.getByRole('link')).toHaveAttribute(
        'href',
        `/en/${BRIEFLY_HREF}`,
      );
    });

    it('should render a span instead of a link with noLink', () => {
      render(
        <Keyword term='accuracy' href='library/rules/x#accuracy' noLink />,
      );
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.getByText('accuracy')).toHaveAttribute(
        'data-keyword',
        'accuracy',
      );
    });
  });

  describe('hover definition', () => {
    it('should show the page shard in the card on hover', async () => {
      render(
        <KeywordShardProvider
          shards={[
            {
              id: 'kw--damage-bonus',
              heading: 'Damage Bonus',
              source: 'The keyed ability alone, without the tier bonus.',
            },
          ]}>
          <Keyword
            term='damage bonus'
            href={DAMAGE_BONUS_HREF}
            templateId='kw--damage-bonus'
            heading='Damage Bonus'
          />
        </KeywordShardProvider>,
      );

      expect(
        screen.queryByRole('region', { name: 'Damage Bonus' }),
      ).not.toBeInTheDocument();

      /* The card machinery and the MDX compiler both load after mount, so the
         bare link renders first and the handlers exist only once both land. */
      await act(async () => {
        await import('@/lib/components/ui/detachableTooltip');
        await import(
          '@/modules/library/infrastructure/compile/compileRuntime'
        );
      });

      vi.useFakeTimers();
      try {
        fireEvent.mouseEnter(screen.getByRole('link'));
        await act(async () => {
          vi.advanceTimersByTime(300);
        });

        /* The card mounts on that tick; its shard only compiles once the
           compiler import the card's body starts has settled. */
        await act(async () => {});

        expect(
          screen.getByRole('region', { name: 'Damage Bonus' }),
        ).toHaveTextContent('keyed ability alone');
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('unresolved terms', () => {
    it('should degrade to a plain span without an href', () => {
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
