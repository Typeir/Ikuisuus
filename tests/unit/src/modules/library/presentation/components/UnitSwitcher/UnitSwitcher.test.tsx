/**
 * @fileoverview UnitSwitcher Component Tests
 * @description Tests that the switcher exposes one labelled radiogroup per
 * measurement family, marks the stored system active, and dispatches a change
 * scoped to a single family.
 *
 * @module tests/unit/modules/library/presentation/components/UnitSwitcher
 * @version 2.0.0
 * @author Typeir
 * @since 2026-08-03
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react Rendering utilities
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSetUnitSystem = vi.fn();
const mockUnitState = {
  unitSystem: { distance: 'stride', weight: 'stride', volume: 'stride' } as Record<
    string,
    'stride' | 'metric' | 'imperial'
  >,
  isHydrated: true,
};

vi.mock('@/lib/hooks/useUnitSystem', () => ({
  useUnitSystemState: () => mockUnitState,
  useUnitSystemActions: () => ({ setUnitSystem: mockSetUnitSystem }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import UnitSwitcher from '@/modules/library/presentation/components/UnitSwitcher/UnitSwitcher';

/**
 * Returns the radiogroup for a measurement family.
 *
 * @param {string} dimension - Family label key, e.g. "dimensionWeight"
 * @returns {HTMLElement} The radiogroup element
 */
const groupFor = (dimension: string): HTMLElement =>
  screen.getByRole('radiogroup', { name: dimension });

describe('UnitSwitcher', () => {
  beforeEach(() => {
    mockSetUnitSystem.mockClear();
    mockUnitState.unitSystem = {
      distance: 'stride',
      weight: 'stride',
      volume: 'stride',
    };
  });

  describe('structure', () => {
    it('should render one radiogroup per measurement family', () => {
      render(<UnitSwitcher />);
      expect(screen.getAllByRole('radiogroup')).toHaveLength(3);
    });

    it.each(['dimensionDistance', 'dimensionWeight', 'dimensionVolume'])(
      'should label the %s group',
      (label) => {
        render(<UnitSwitcher />);
        expect(groupFor(label)).toBeInTheDocument();
      },
    );

    it('should offer three systems in every group', () => {
      render(<UnitSwitcher />);

      for (const label of [
        'dimensionDistance',
        'dimensionWeight',
        'dimensionVolume',
      ]) {
        expect(within(groupFor(label)).getAllByRole('radio')).toHaveLength(3);
      }
    });
  });

  describe('active system', () => {
    it('should mark the stored system active per family', () => {
      mockUnitState.unitSystem = {
        distance: 'metric',
        weight: 'imperial',
        volume: 'stride',
      };
      render(<UnitSwitcher />);

      expect(
        within(groupFor('dimensionDistance')).getByRole('radio', {
          name: 'switcherMetric',
        }),
      ).toHaveAttribute('aria-checked', 'true');

      expect(
        within(groupFor('dimensionWeight')).getByRole('radio', {
          name: 'switcherImperial',
        }),
      ).toHaveAttribute('aria-checked', 'true');
    });

    it('should leave other systems unchecked', () => {
      mockUnitState.unitSystem = {
        distance: 'metric',
        weight: 'stride',
        volume: 'stride',
      };
      render(<UnitSwitcher />);

      expect(
        within(groupFor('dimensionDistance')).getByRole('radio', {
          name: 'switcherStride',
        }),
      ).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('selection', () => {
    it('should dispatch a change scoped to one family', async () => {
      const user = userEvent.setup();
      render(<UnitSwitcher />);

      await user.click(
        within(groupFor('dimensionWeight')).getByRole('radio', {
          name: 'switcherImperial',
        }),
      );

      expect(mockSetUnitSystem).toHaveBeenCalledWith('weight', 'imperial');
    });

    it('should allow returning a family to the native system', async () => {
      const user = userEvent.setup();
      mockUnitState.unitSystem = {
        distance: 'metric',
        weight: 'stride',
        volume: 'stride',
      };
      render(<UnitSwitcher />);

      await user.click(
        within(groupFor('dimensionDistance')).getByRole('radio', {
          name: 'switcherStride',
        }),
      );

      expect(mockSetUnitSystem).toHaveBeenCalledWith('distance', 'stride');
    });

    it('should not change other families', async () => {
      const user = userEvent.setup();
      render(<UnitSwitcher />);

      await user.click(
        within(groupFor('dimensionVolume')).getByRole('radio', {
          name: 'switcherMetric',
        }),
      );

      expect(mockSetUnitSystem).toHaveBeenCalledTimes(1);
      expect(mockSetUnitSystem).toHaveBeenCalledWith('volume', 'metric');
    });
  });
});
