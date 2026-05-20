/**
 * @fileoverview Equipment Context Tests
 * @description Unit tests for the equipment context provider and hook.
 *
 * @module tests/unit/lib/components/characterSheet/context/equipmentContext
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
    EquipmentProvider,
    useEquipmentContext,
} from '@/lib/components/characterSheet/context/equipmentContext';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

/** Helper component that reads and renders context values. */
const ContextReader = () => {
  const { totalWeight, totalCount } = useEquipmentContext();
  return (
    <>
      <span data-testid='weight'>{totalWeight}</span>
      <span data-testid='count'>{totalCount}</span>
    </>
  );
};

describe('EquipmentContext', () => {
  it('provides default values when no provider is present', () => {
    render(<ContextReader />);
    expect(screen.getByTestId('weight').textContent).toBe('0');
    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  it('forwards values from the provider to consumers', () => {
    render(
      <EquipmentProvider value={{ totalWeight: 12.5, totalCount: 3 }}>
        <ContextReader />
      </EquipmentProvider>,
    );
    expect(screen.getByTestId('weight').textContent).toBe('12.5');
    expect(screen.getByTestId('count').textContent).toBe('3');
  });
});
