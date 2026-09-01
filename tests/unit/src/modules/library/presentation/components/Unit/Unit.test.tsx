/**
 * @fileoverview Unit MDX Component Tests
 * @description Tests that the Unit component renders the native stride form
 * before hydration, converts once hydrated, links to the Measures rule page,
 * and carries every system in its accessible name.
 *
 * @module tests/unit/src/modules/library/presentation/components/Unit/Unit.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-03
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react Rendering utilities
 */

import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dom')>();
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

const mockUnitState = {
  unitSystem: { distance: 'stride', weight: 'stride', volume: 'stride' } as Record<string, 'stride'|'metric'|'imperial'>,
  isHydrated: false,
};

vi.mock('@/lib/hooks/useUnitSystem', () => ({
  useUnitSystemState: () => mockUnitState,
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations:
    () =>
    (key: string, values?: Record<string, string | number>): string => {
      if (values?.renderings) {
        return `${values.renderings} — see Measures`;
      }
      if (!values) {
        return key;
      }
      const args = Object.entries(values)
        .map(([k, v]) => `${k}=${v}`)
        .join('|');
      return `${key}(${args})`;
    },
}));

import Unit from '@/modules/library/presentation/components/Unit/Unit';

describe('Unit', () => {
  beforeEach(() => {
    mockUnitState.unitSystem = { distance: 'stride', weight: 'stride', volume: 'stride' };
    mockUnitState.isHydrated = false;
  });

  describe('rendering the chosen system', () => {
    it('should render the native form by default', () => {
      render(<Unit value='6' unit='stride' />);
      expect(screen.getByRole('link')).toHaveTextContent('6 strides');
    });

    it('should render metric when preferred', () => {
      mockUnitState.unitSystem = { distance: 'metric', weight: 'metric', volume: 'metric' };
      render(<Unit value='6' unit='stride' />);
      expect(screen.getByRole('link')).toHaveTextContent('12 metres');
    });

    it('should render imperial when preferred', () => {
      mockUnitState.unitSystem = { distance: 'imperial', weight: 'imperial', volume: 'imperial' };
      render(<Unit value='6' unit='stride' />);
      expect(screen.getByRole('link')).toHaveTextContent('30 feet');
    });
  });

  describe('per-dimension preferences', () => {
    it('should read the weight preference for a burden', () => {
      mockUnitState.unitSystem = { distance: 'stride', weight: 'imperial', volume: 'stride' };
      render(<Unit value='30' unit='burden' />);
      expect(screen.getByRole('link')).toHaveTextContent('60 pounds');
    });

    it('should not let the weight preference affect a distance', () => {
      mockUnitState.unitSystem = { distance: 'stride', weight: 'imperial', volume: 'stride' };
      render(<Unit value='6' unit='stride' />);
      expect(screen.getByRole('link')).toHaveTextContent('6 strides');
    });

    it('should read the distance preference for a league', () => {
      mockUnitState.unitSystem = { distance: 'metric', weight: 'stride', volume: 'stride' };
      render(<Unit value='3' unit='league' />);
      expect(screen.getByRole('link')).toHaveTextContent('6 kilometres');
    });

    it('should read the volume preference independently', () => {
      mockUnitState.unitSystem = { distance: 'stride', weight: 'stride', volume: 'imperial' };
      render(<Unit value='2' unit='volume' />);
      expect(screen.getByRole('link')).toHaveTextContent('4 pints');
    });
  });

  describe('attributive form', () => {
    it('should hyphenate and singularise with the ADJ flag', () => {
      render(<Unit value='6' unit='stride' flags='ADJ' />);
      expect(screen.getByRole('link')).toHaveTextContent('6-stride');
    });
  });

  describe('linking and accessibility', () => {
    it('should link to the Measures rule page', () => {
      render(<Unit value='6' unit='stride' />);
      expect(screen.getByRole('link')).toHaveAttribute(
        'href',
        '/en/library/rules/steel-and-strife/measures',
      );
    });

    it('should not use the browser title popup', () => {
      render(<Unit value='6' unit='stride' />);
      expect(screen.getByRole('link')).not.toHaveAttribute('title');
    });

    it('should carry all three systems in the accessible name', () => {
      render(<Unit value='6' unit='stride' />);
      expect(screen.getByRole('link')).toHaveAccessibleName(
        '6 strides, 12 metres, 30 feet — see Measures',
      );
    });

    it('should show all three systems in the wiki tooltip on hover', () => {
      vi.useFakeTimers();
      try {
        render(<Unit value='6' unit='stride' />);

        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

        fireEvent.mouseEnter(screen.getByRole('link'));
        act(() => {
          vi.advanceTimersByTime(300);
        });

        const tooltip = screen.getByRole('tooltip');
        for (const rendering of ['6 strides', '12 metres', '30 feet']) {
          expect(tooltip).toHaveTextContent(rendering);
        }
      } finally {
        vi.useRealTimers();
      }
    });

    it('should leave the link untouched before mount so static output matches', () => {
      const { container } = render(<Unit value='6' unit='stride' />);
      expect(container.querySelector('a')).toBe(screen.getByRole('link'));
    });

    it('should expose the unit as a data attribute', () => {
      render(<Unit value='6' unit='stride' />);
      expect(screen.getByRole('link')).toHaveAttribute('data-unit', 'stride');
    });
  });

  describe('fractional quantities', () => {
    it('should compose fraction prose by substitution', () => {
      render(<Unit value='1' unit='stride' denominator='5' />);

      expect(screen.getByRole('link')).toHaveTextContent(
        'fraction.ofA(amount=fraction.amount.1_5|unit=stride)',
      );
    });

    it('should use the irregular template for a half', () => {
      mockUnitState.isHydrated = true;
      mockUnitState.unitSystem = { distance: 'stride', weight: 'stride', volume: 'stride' };
      render(<Unit value='1' unit='stride' denominator='2' />);

      expect(screen.getByRole('link')).toHaveTextContent(
        'fraction.halfA(unit=stride)',
      );
    });

    it('should render a scaled fraction that resolves whole', () => {
      mockUnitState.isHydrated = true;
      mockUnitState.unitSystem = { distance: 'imperial', weight: 'imperial', volume: 'imperial' };
      render(<Unit value='1' unit='stride' denominator='5' />);

      expect(screen.getByRole('link')).toHaveTextContent(
        'fraction.whole(value=1|unit=foot)',
      );
    });

    it('should render a mixed quantity', () => {
      mockUnitState.isHydrated = true;
      mockUnitState.unitSystem = { distance: 'imperial', weight: 'imperial', volume: 'imperial' };
      render(<Unit value='1' unit='stride' denominator='2' />);

      expect(screen.getByRole('link')).toHaveTextContent(
        'fraction.mixedHalf(whole=2|unit=feet)',
      );
    });
  });
});
