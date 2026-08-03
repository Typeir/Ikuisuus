/**
 * @fileoverview Unit MDX Component Tests
 * @description Tests that the Unit component renders the native stride form
 * before hydration, converts once hydrated, links to the Measures rule page,
 * and carries every system in its accessible name.
 *
 * @module tests/unit/modules/library/presentation/components/Unit
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-03
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react Rendering utilities
 */

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockUnitState = {
  unitSystem: 'stride' as 'stride' | 'metric' | 'imperial',
  isHydrated: false,
};

vi.mock('@/lib/hooks/useUnitSystem', () => ({
  useUnitSystemState: () => mockUnitState,
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string, values?: Record<string, string>) =>
    values?.renderings ? `${values.renderings} — see Measures` : key,
}));

import Unit from '@/modules/library/presentation/components/Unit/Unit';

describe('Unit', () => {
  beforeEach(() => {
    mockUnitState.unitSystem = 'stride';
    mockUnitState.isHydrated = false;
  });

  describe('before hydration', () => {
    it('should render the native stride form', () => {
      render(<Unit value='6' unit='stride' />);
      expect(screen.getByRole('link')).toHaveTextContent('6 strides');
    });

    it('should render strides even when a different preference is stored', () => {
      mockUnitState.unitSystem = 'imperial';
      render(<Unit value='6' unit='stride' />);
      expect(screen.getByRole('link')).toHaveTextContent('6 strides');
    });
  });

  describe('after hydration', () => {
    beforeEach(() => {
      mockUnitState.isHydrated = true;
    });

    it('should render metric when preferred', () => {
      mockUnitState.unitSystem = 'metric';
      render(<Unit value='6' unit='stride' />);
      expect(screen.getByRole('link')).toHaveTextContent('12 metres');
    });

    it('should render imperial when preferred', () => {
      mockUnitState.unitSystem = 'imperial';
      render(<Unit value='6' unit='stride' />);
      expect(screen.getByRole('link')).toHaveTextContent('30 feet');
    });

    it('should convert burdens to pounds', () => {
      mockUnitState.unitSystem = 'imperial';
      render(<Unit value='30' unit='burden' />);
      expect(screen.getByRole('link')).toHaveTextContent('60 pounds');
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

    it('should carry all three systems in the title', () => {
      render(<Unit value='6' unit='stride' />);
      expect(screen.getByRole('link')).toHaveAttribute(
        'title',
        '6 strides · 12 metres · 30 feet',
      );
    });

    it('should expose the unit as a data attribute', () => {
      render(<Unit value='6' unit='stride' />);
      expect(screen.getByRole('link')).toHaveAttribute('data-unit', 'stride');
    });
  });

  describe('fractional quantities', () => {
    it('should resolve fractions through the translation dictionary', () => {
      render(<Unit value='1' unit='stride' denominator='5' />);
      expect(screen.getByRole('link')).toHaveTextContent(
        'fraction.stride.1_5.stride',
      );
    });
  });
});
