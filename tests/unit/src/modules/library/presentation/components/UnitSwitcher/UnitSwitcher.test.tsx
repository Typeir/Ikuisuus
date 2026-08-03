/**
 * @fileoverview UnitSwitcher Component Tests
 * @description Tests that the switcher exposes a labelled radiogroup, marks the
 * native system active before hydration, and dispatches the chosen system.
 *
 * @module tests/unit/modules/library/presentation/components/UnitSwitcher
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-03
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react Rendering utilities
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSetUnitSystem = vi.fn();
const mockUnitState = {
  unitSystem: 'stride' as 'stride' | 'metric' | 'imperial',
  isHydrated: false,
};

vi.mock('@/lib/hooks/useUnitSystem', () => ({
  useUnitSystemState: () => mockUnitState,
  useUnitSystemActions: () => ({ setUnitSystem: mockSetUnitSystem }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import UnitSwitcher from '@/modules/library/presentation/components/UnitSwitcher/UnitSwitcher';

describe('UnitSwitcher', () => {
  beforeEach(() => {
    mockSetUnitSystem.mockClear();
    mockUnitState.unitSystem = 'stride';
    mockUnitState.isHydrated = false;
  });

  describe('structure', () => {
    it('should render a labelled radiogroup', () => {
      render(<UnitSwitcher />);
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    it('should offer all three systems', () => {
      render(<UnitSwitcher />);
      expect(screen.getAllByRole('radio')).toHaveLength(3);
    });
  });

  describe('active system', () => {
    it('should mark stride active before hydration', () => {
      mockUnitState.unitSystem = 'imperial';
      render(<UnitSwitcher />);

      expect(screen.getByRole('radio', { name: 'switcherStride' })).toHaveAttribute(
        'aria-checked',
        'true',
      );
    });

    it('should mark the stored system active after hydration', () => {
      mockUnitState.unitSystem = 'metric';
      mockUnitState.isHydrated = true;
      render(<UnitSwitcher />);

      expect(screen.getByRole('radio', { name: 'switcherMetric' })).toHaveAttribute(
        'aria-checked',
        'true',
      );
    });
  });

  describe('selection', () => {
    it('should dispatch the chosen system', async () => {
      const user = userEvent.setup();
      render(<UnitSwitcher />);

      await user.click(screen.getByRole('radio', { name: 'switcherImperial' }));

      expect(mockSetUnitSystem).toHaveBeenCalledWith('imperial');
    });

    it('should allow returning to the native system', async () => {
      const user = userEvent.setup();
      mockUnitState.unitSystem = 'metric';
      mockUnitState.isHydrated = true;
      render(<UnitSwitcher />);

      await user.click(screen.getByRole('radio', { name: 'switcherStride' }));

      expect(mockSetUnitSystem).toHaveBeenCalledWith('stride');
    });
  });
});
