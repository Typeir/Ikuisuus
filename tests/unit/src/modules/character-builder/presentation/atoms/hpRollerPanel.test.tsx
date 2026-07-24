/**
 * @fileoverview HpRollerPanel Unit Tests
 * @description Tests for the HpRollerPanel atom component.
 *
 * @module tests/unit/lib/components/characterSheet/atoms/hpRollerPanel
 * @version 1.0.0
 * @author Typeir
 * @since 6.0.0
 */

import { HpRollerPanel } from '@/modules/character-builder/presentation/atoms/hpRollerPanel';
import { recalculateHpMax } from '@/modules/character-builder/lib/utils/hitDiceUtils';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { HitDieRollEntry } from '@/lib/types/hitDice';

/** Assert against real English copy rather than raw message keys. */
vi.mock('next-intl', async (importOriginal) => {
  const { createRealMessageIntlMock } = await import('@tests/setup/intlMock');
  return createRealMessageIntlMock(
    await importOriginal<Record<string, unknown>>(),
  );
});

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
    expect(screen.getByRole('button', { name: /open hit dice roller/i })).toBeTruthy();
  });

  it('shows unrolled count badge when entries exist', () => {
    const log = [makeEntry('1', 'Berserker', 'Berserker', '12', 1)];
    render(<HpRollerPanel hitDiceLog={log} conMod={2} onCommit={vi.fn()} />);
    expect(screen.getByText('1')).toBeTruthy();
  });

  it('opens panel on trigger click', () => {
    render(
      <HpRollerPanel hitDiceLog={[]} conMod={2} onCommit={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /open hit dice roller/i }));
    expect(screen.getByRole('dialog', { name: /hit dice roller/i })).toBeTruthy();
  });

  it('shows empty message when log is empty', () => {
    render(
      <HpRollerPanel hitDiceLog={[]} conMod={2} onCommit={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /open hit dice roller/i }));
    expect(screen.getByText(/no hit dice tracked/i)).toBeTruthy();
  });

  it('shows Roll button for unrolled entries', () => {
    const log = [makeEntry('1', 'Berserker', 'Berserker', '12', 1)];
    render(<HpRollerPanel hitDiceLog={log} conMod={2} onCommit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /open hit dice roller/i }));
    expect(screen.getByText('Roll d12')).toBeTruthy();
  });

  it('shows Add to HP button after rolling', () => {
    const log = [makeEntry('1', 'Berserker', 'Berserker', '12', 1)];
    render(<HpRollerPanel hitDiceLog={log} conMod={2} onCommit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /open hit dice roller/i }));
    fireEvent.click(screen.getByText('Roll d12'));
    expect(screen.getByText('Add to HP')).toBeTruthy();
  });

  it('calls onCommit with the updated log when Add to HP is clicked', () => {
    const onCommit = vi.fn();
    const log = [makeEntry('1', 'Berserker', 'Berserker', '12', 1, 8)];
    render(<HpRollerPanel hitDiceLog={log} conMod={2} onCommit={onCommit} />);
    fireEvent.click(screen.getByRole('button', { name: /open hit dice roller/i }));
    fireEvent.click(screen.getByText('Add to HP'));
    expect(onCommit).toHaveBeenCalledOnce();
    const [updatedLog] = onCommit.mock.calls[0];
    expect(updatedLog[0].addedToHp).toBe(true);
    expect(recalculateHpMax(updatedLog)).toBe(10);
  });

  it('committed entries are shown as read-only', () => {
    const log = [makeEntry('1', 'Berserker', 'Berserker', '12', 1, 8, true)];
    render(<HpRollerPanel hitDiceLog={log} conMod={2} onCommit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /open hit dice roller/i }));
    expect(screen.queryByText('Add to HP')).toBeNull();
    expect(screen.queryByText(/roll d12/i)).toBeNull();
  });
});
