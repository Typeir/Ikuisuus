/**
 * @fileoverview CarryingCapacityCalculator Unit Tests
 *
 * @module tests/unit/src/modules/character-builder/presentation/CarryingCapacity/carryingCapacityCalculator.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { CarryingCapacityCalculator } from '@/modules/character-builder/presentation/CarryingCapacity/carryingCapacityCalculator';
import { createEmptyCharacter } from '@/modules/character-builder/lib/utils/characterStorage';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithActiveSheet } from '@tests/setup/renderWithActiveSheet';
import { describe, expect, it, vi } from 'vitest';

/** Assert against real English copy — thresholds are interpolated into it. */
vi.mock('next-intl', async (importOriginal) => {
  const { createRealMessageIntlMock } = await import('@tests/setup/intlMock');
  return createRealMessageIntlMock(
    await importOriginal<Record<string, unknown>>(),
  );
});

describe('CarryingCapacityCalculator', () => {
  const baseSheet = () => {
    const data = createEmptyCharacter();
    data.abilityScores = {
      ...data.abilityScores,
      str: 15,
    };
    return data;
  };

  it('renders default Medium biped thresholds for STR 15', () => {
    renderWithActiveSheet(<CarryingCapacityCalculator />, {
      character: baseSheet(),
    });
    expect(screen.getByText(/Light ≤ 66 lb/)).toBeTruthy();
    expect(screen.getByText(/Medium ≤ 133 lb/)).toBeTruthy();
    expect(screen.getByText(/Heavy ≤ 200 lb/)).toBeTruthy();
  });

  it('updates thresholds when size changes to Large', () => {
    renderWithActiveSheet(<CarryingCapacityCalculator />, {
      character: baseSheet(),
    });
    const sizeSelect = screen.getByLabelText(/Size/) as HTMLSelectElement;
    fireEvent.change(sizeSelect, { target: { value: 'large' } });
    expect(screen.getByText(/Heavy ≤ 400 lb/)).toBeTruthy();
  });

  it('classifies the load as Medium when carried exceeds light threshold', () => {
    renderWithActiveSheet(<CarryingCapacityCalculator />, {
      character: baseSheet(),
    });
    const carriedInput = screen.getByLabelText(/Carried/) as HTMLInputElement;
    fireEvent.change(carriedInput, { target: { value: '100' } });
    expect(screen.getByText('Medium load')).toBeTruthy();
  });

  it('shows Over capacity when carried exceeds heavy threshold', () => {
    renderWithActiveSheet(<CarryingCapacityCalculator />, {
      character: baseSheet(),
    });
    const carriedInput = screen.getByLabelText(/Carried/) as HTMLInputElement;
    fireEvent.change(carriedInput, { target: { value: '500' } });
    expect(screen.getByText('Over capacity')).toBeTruthy();
  });
});
