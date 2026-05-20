/**
 * @fileoverview HpRollerPanel Unit Tests
 * @description Tests for the HpRollerPanel atom component.
 *
 * @module tests/unit/lib/components/characterSheet/atoms/hpRollerPanel
 * @version 1.0.0
 * @author Typeir
 * @since 6.0.0
 */

import { HpRollerPanel } from '@/lib/components/characterSheet/atoms/hpRollerPanel';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { HitDieRollEntry } from '@/lib/types/hitDice';

const makeEntry = (
  id: string,
  vocSlug: string,
  vocTitle: string,
  dieType: string,
  levelIndex: number,
  result: number | null = null,
  addedToHp = false,
): HitDieRollEntry => ({
  id,
  vocSlug,
  vocTitle,
  dieType,
  levelIndex,
  result,
  conMod: 2,
  addedToHp,
});

describe('HpRollerPanel', () => {
  it('renders a trigger button', () => {
    render(
      <HpRollerPanel hitDiceLog={[]} conMod={2} onCommit={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: /openHitDiceRoller/i })).toBeTruthy();
  });

  it('shows unrolled count badge when entries exist', () => {
    const log = [makeEntry('1', 'barbarian', 'Barbarian', '12', 1)];
    render(<HpRollerPanel hitDiceLog={log} conMod={2} onCommit={vi.fn()} />);
    expect(screen.getByText('1')).toBeTruthy();
  });

  it('opens panel on trigger click', () => {
    render(
      <HpRollerPanel hitDiceLog={[]} conMod={2} onCommit={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /openHitDiceRoller/i }));
    expect(screen.getByRole('dialog', { name: /hitDiceRoller/i })).toBeTruthy();
  });

  it('shows empty message when log is empty', () => {
    render(
      <HpRollerPanel hitDiceLog={[]} conMod={2} onCommit={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /openHitDiceRoller/i }));
    expect(screen.getByText(/noHitDiceTracked/i)).toBeTruthy();
  });

  it('shows Roll button for unrolled entries', () => {
    const log = [makeEntry('1', 'barbarian', 'Barbarian', '12', 1)];
    render(<HpRollerPanel hitDiceLog={log} conMod={2} onCommit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /openHitDiceRoller/i }));
    expect(screen.getByText(/rollDie/)).toBeTruthy();
  });

  it('shows Add to HP button after rolling', () => {
    const log = [makeEntry('1', 'barbarian', 'Barbarian', '12', 1)];
    render(<HpRollerPanel hitDiceLog={log} conMod={2} onCommit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /openHitDiceRoller/i }));
    fireEvent.click(screen.getByText(/rollDie/));
    expect(screen.getByText(/addToHp/)).toBeTruthy();
  });

  it('calls onCommit when Add to HP is clicked', () => {
    const onCommit = vi.fn();
    const log = [makeEntry('1', 'barbarian', 'Barbarian', '12', 1, 8)];
    render(<HpRollerPanel hitDiceLog={log} conMod={2} onCommit={onCommit} />);
    fireEvent.click(screen.getByRole('button', { name: /openHitDiceRoller/i }));
    fireEvent.click(screen.getByText(/addToHp/));
    expect(onCommit).toHaveBeenCalledOnce();
    const [updatedLog, hpDelta] = onCommit.mock.calls[0];
    expect(hpDelta).toBe(10);
    expect(updatedLog[0].addedToHp).toBe(true);
  });

  it('committed entries are shown as read-only', () => {
    const log = [makeEntry('1', 'barbarian', 'Barbarian', '12', 1, 8, true)];
    render(<HpRollerPanel hitDiceLog={log} conMod={2} onCommit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /openHitDiceRoller/i }));
    expect(screen.queryByText(/addToHp/)).toBeNull();
    expect(screen.queryByText(/rollDie/i)).toBeNull();
  });

  it('Roll All commits every uncommitted entry in one click', () => {
    const onCommit = vi.fn();
    const log = [
      makeEntry('1', 'barbarian', 'Barbarian', '12', 1),
      makeEntry('2', 'barbarian', 'Barbarian', '12', 2),
      makeEntry('3', 'barbarian', 'Barbarian', '12', 3),
    ];
    render(<HpRollerPanel hitDiceLog={log} conMod={2} onCommit={onCommit} />);
    fireEvent.click(
      screen.getByRole('button', { name: /openHitDiceRoller/i }),
    );
    fireEvent.click(screen.getByRole('button', { name: /ariaRollAllHitDice/i }));
    expect(onCommit).toHaveBeenCalledOnce();
    const [updatedLog, hpDelta] = onCommit.mock.calls[0];
    expect(updatedLog.every((e: { addedToHp: boolean }) => e.addedToHp)).toBe(
      true,
    );
    // Each roll is 1..12 plus +2 CON, so delta is between 3*3=9 and 3*14=42.
    expect(hpDelta).toBeGreaterThanOrEqual(9);
    expect(hpDelta).toBeLessThanOrEqual(42);
  });

  it('Average All uses the standard d20 average (floor(faces/2)+1) for each die', () => {
    const onCommit = vi.fn();
    const log = [
      makeEntry('1', 'barbarian', 'Barbarian', '12', 1),
      makeEntry('2', 'barbarian', 'Barbarian', '12', 2),
    ];
    render(<HpRollerPanel hitDiceLog={log} conMod={2} onCommit={onCommit} />);
    fireEvent.click(
      screen.getByRole('button', { name: /openHitDiceRoller/i }),
    );
    fireEvent.click(screen.getByRole('button', { name: /ariaAverageAllHitDice/i }));
    expect(onCommit).toHaveBeenCalledOnce();
    const [updatedLog, hpDelta] = onCommit.mock.calls[0];
    // d12 average = floor(12/2)+1 = 7. Two dice + (7+2) each = 18.
    expect(hpDelta).toBe(18);
    expect(updatedLog.every((e: { result: number | null }) => e.result === 7)).toBe(
      true,
    );
  });

  it('hides bulk action buttons when all entries are confirmed', () => {
    const log = [makeEntry('1', 'barbarian', 'Barbarian', '12', 1, 8, true)];
    render(<HpRollerPanel hitDiceLog={log} conMod={2} onCommit={vi.fn()} />);
    fireEvent.click(
      screen.getByRole('button', { name: /openHitDiceRoller/i }),
    );
    expect(screen.queryByRole('button', { name: /ariaRollAllHitDice/i })).toBeNull();
    expect(
      screen.queryByRole('button', { name: /ariaAverageAllHitDice/i }),
    ).toBeNull();
  });
});
