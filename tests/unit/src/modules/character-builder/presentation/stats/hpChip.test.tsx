/**
 * @fileoverview HpChip Unit Tests
 * @description Smoke tests for the HP combat stat chip, which reads the
 * character and write API from the active-sheet context and takes only its lock
 * behaviour and commit callback as props.
 *
 * @module tests/unit/character-builder/presentation/stats/hpChip
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { HpChipMemo } from '@/modules/character-builder/presentation/stats/hpChip';
import { screen } from '@testing-library/react';
import { renderWithActiveSheet } from '@tests/setup/renderWithActiveSheet';
import { describe, expect, it, vi } from 'vitest';

describe('HpChip', () => {
  it('locks current HP (read-only) and the roller when the hp lock is engaged', () => {
    renderWithActiveSheet(
      <HpChipMemo
        isUnlocked={() => false}
        toggle={vi.fn()}
        onHitDiceCommit={vi.fn()}
      />,
      { character: { hpCurrent: 10, hpMax: 10 } },
    );
    expect(screen.getByText('hp')).toBeInTheDocument();
    const current = screen.getByLabelText('hpCurrent');
    expect(current.tagName).not.toBe('INPUT');
    expect(current.textContent).toBe('10');
    const roller = screen.getByRole('button', {
      name: 'hpRollerTriggerLabel',
    }) as HTMLButtonElement;
    expect(roller.disabled).toBe(true);
  });

  it('unlocks current HP editing and the roller when unlocked', () => {
    renderWithActiveSheet(
      <HpChipMemo
        isUnlocked={() => true}
        toggle={vi.fn()}
        onHitDiceCommit={vi.fn()}
      />,
      { character: { hpCurrent: 10, hpMax: 10 } },
    );
    const current = screen.getByLabelText('hpCurrent') as HTMLInputElement;
    expect(current.tagName).toBe('INPUT');
    expect(current.value).toBe('10');
    const roller = screen.getByRole('button', {
      name: 'hpRollerTriggerLabel',
    }) as HTMLButtonElement;
    expect(roller.disabled).toBe(false);
  });

  it('shows temp HP and a read-only derived max regardless of lock', () => {
    renderWithActiveSheet(
      <HpChipMemo
        isUnlocked={() => false}
        toggle={vi.fn()}
        onHitDiceCommit={vi.fn()}
      />,
      { character: { hpCurrent: 10, hpMax: 10, tempHp: 5 } },
    );
    expect(screen.getByText(/\+5/)).toBeInTheDocument();
    expect(screen.getByLabelText('hpMax').tagName).not.toBe('INPUT');
  });
});
