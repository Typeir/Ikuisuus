/**
 * @fileoverview CombatStatChips Unit Tests
 * @description Smoke tests for the combat stat chips component, which reads the
 * character and write API from the active-sheet context.
 *
 * @module tests/unit/character-builder/presentation/stats/combatStatChips
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { useSheetData } from '@/modules/character-builder/application/context/activeSheetContext';
import { CombatStatChips } from '@/modules/character-builder/presentation/stats/combatStatChips';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithActiveSheet } from '@tests/setup/renderWithActiveSheet';
import { describe, expect, it } from 'vitest';

/** Seed overrides applied on top of an empty character. */
const CHARACTER = { gritCurrent: 3, gritMax: 5, tierBonus: 2 };

describe('CombatStatChips', () => {
  it('renders all six stat chips', () => {
    renderWithActiveSheet(<CombatStatChips />, { character: CHARACTER });
    expect(screen.getByText('hp')).toBeInTheDocument();
    expect(screen.getByText('ac')).toBeInTheDocument();
    expect(screen.getByText('initiative')).toBeInTheDocument();
    expect(screen.getByText('speed')).toBeInTheDocument();
    expect(screen.getByText('tierShort')).toBeInTheDocument();
    expect(screen.getByText('grit')).toBeInTheDocument();
  });

  it('shows grit value', () => {
    renderWithActiveSheet(<CombatStatChips />, { character: CHARACTER });
    expect(screen.getByText('3/5')).toBeInTheDocument();
  });

  it('shows a lock button for each of the six stat chips', () => {
    renderWithActiveSheet(<CombatStatChips />, { character: CHARACTER });
    const lockButtons = screen.getAllByRole('button', { name: /lock/i });
    expect(lockButtons.length).toBe(6);
  });

  it('reflects the locks stored on the character', () => {
    renderWithActiveSheet(<CombatStatChips />, {
      character: { ...CHARACTER, manualStatOverrides: ['ac'] },
    });
    expect(screen.getByLabelText('ac').tagName).toBe('INPUT');
  });

  it('writes an unlocked stat back to the character', async () => {
    const sheet: { overrides: string[] } = { overrides: [] };

    /**
     * Probe recording the persisted lock list.
     *
     * @component
     * @returns {null} Renders nothing
     */
    const Probe: React.FC = () => {
      sheet.overrides = useSheetData().manualStatOverrides;
      return null;
    };

    renderWithActiveSheet(
      <>
        <CombatStatChips />
        <Probe />
      </>,
      { character: CHARACTER },
    );

    const acLock = screen.getAllByRole('button', { name: /lock/i })[1];
    await userEvent.click(acLock);

    expect(sheet.overrides).toContain('ac');
  });
});
