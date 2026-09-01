/**
 * @fileoverview CoinPouch Unit Tests
 * @description Smoke tests for the CoinPouch component, which reads the
 * character, edit mode, and write API from the active-sheet context.
 *
 * @module tests/unit/src/modules/character-builder/presentation/CarryingCapacity/coinPouch.test
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { CharacterCoinHoldings } from '@/lib/types/character';
import { useSheetData } from '@/modules/character-builder/application/context/activeSheetContext';
import { CoinPouch } from '@/modules/character-builder/presentation/CarryingCapacity/coinPouch';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithActiveSheet } from '@tests/setup/renderWithActiveSheet';
import { describe, expect, it, vi } from 'vitest';

/** Assert against real English copy rather than raw message keys. */
vi.mock('next-intl', async (importOriginal) => {
  const { createRealMessageIntlMock } = await import('@tests/setup/intlMock');
  return createRealMessageIntlMock(
    await importOriginal<Record<string, unknown>>(),
  );
});

describe('CoinPouch', () => {
  it('migrates legacy currency into a Gold Standard holdings card', () => {
    renderWithActiveSheet(<CoinPouch />, {
      character: {
        currency: { pp: 1, gp: 5, ep: 0, sp: 10, cp: 50 },
        coinHoldings: [],
      },
    });
    expect(screen.getByText('Gold Standard')).toBeTruthy();
    expect(screen.getAllByText(/Gold/).length).toBeGreaterThan(0);
  });

  it('renders existing coinHoldings without falling back to legacy currency', () => {
    renderWithActiveSheet(<CoinPouch />, {
      character: {
        coinHoldings: [{ systemName: 'Gold Standard', counts: { Gold: 7 } }],
      },
    });
    expect(screen.getByText('Gold Standard')).toBeTruthy();
    expect(screen.getByText('7')).toBeTruthy();
  });

  it('writes the updated coinHoldings to the sheet when a count changes in edit mode', () => {
    const captured: { current: CharacterCoinHoldings[] } = { current: [] };

    /**
     * Probe that records the coin holdings the context currently holds.
     *
     * @component
     * @returns {null} Renders nothing
     */
    const Probe: React.FC = () => {
      captured.current = useSheetData().coinHoldings;
      return null;
    };

    renderWithActiveSheet(
      <>
        <CoinPouch />
        <Probe />
      </>,
      {
        character: {
          coinHoldings: [{ systemName: 'Gold Standard', counts: { Gold: 5 } }],
        },
        editing: true,
      },
    );

    const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    const goldInput = inputs.find((el) => el.value === '5');
    expect(goldInput).toBeTruthy();
    fireEvent.change(goldInput!, { target: { value: '12' } });

    expect(captured.current[0].counts.Gold).toBe(12);
  });

  it('exposes an Add system button only when editing', () => {
    renderWithActiveSheet(<CoinPouch />);
    expect(screen.queryByLabelText('Add currency system')).toBeNull();

    renderWithActiveSheet(<CoinPouch />, { editing: true });
    expect(screen.getByLabelText('Add currency system')).toBeTruthy();
  });
});
