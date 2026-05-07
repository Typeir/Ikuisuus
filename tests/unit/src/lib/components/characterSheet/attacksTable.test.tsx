/**
 * @fileoverview AttacksTable Unit Tests
 * @description Tests for the AttacksTable component.
 *
 * @module tests/unit/lib/components/characterSheet/attacksTable
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { AttacksTable } from '@/lib/components/characterSheet/attacksTable';
import type { CharacterAttack } from '@/lib/types/character';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const ATTACKS: CharacterAttack[] = [
  {
    id: 'a1',
    name: 'Longsword',
    toHit: '+5',
    damage: '1d8+3 slashing',
    notes: '',
  },
];

describe('AttacksTable', () => {
  it('renders existing attack entries', () => {
    render(<AttacksTable attacks={ATTACKS} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('Longsword')).toBeTruthy();
    expect(screen.getByDisplayValue('+5')).toBeTruthy();
    expect(screen.getByDisplayValue('1d8+3 slashing')).toBeTruthy();
  });

  it('calls onChange when a field is edited', async () => {
    const onChange = vi.fn();
    render(<AttacksTable attacks={ATTACKS} onChange={onChange} />);
    const nameInput = screen.getByDisplayValue('Longsword');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Dagger');
    expect(onChange).toHaveBeenCalled();
  });

  it('calls onChange with new empty row when Add Attack is clicked', async () => {
    const onChange = vi.fn();
    render(<AttacksTable attacks={ATTACKS} onChange={onChange} />);
    await userEvent.click(
      screen.getByRole('button', { name: 'ariaAddAttack' }),
    );
    expect(onChange).toHaveBeenCalledOnce();
    const newList = onChange.mock.calls[0][0] as CharacterAttack[];
    expect(newList).toHaveLength(2);
    expect(newList[1].name).toBe('');
  });

  it('calls onChange removing the entry when trash button is clicked', async () => {
    const onChange = vi.fn();
    render(<AttacksTable attacks={ATTACKS} onChange={onChange} />);
    await userEvent.click(
      screen.getByRole('button', { name: 'ariaRemoveAttack' }),
    );
    expect(onChange).toHaveBeenCalledOnce();
    const newList = onChange.mock.calls[0][0] as CharacterAttack[];
    expect(newList).toHaveLength(0);
  });

  it('shows static text in readOnly mode', () => {
    render(<AttacksTable attacks={ATTACKS} onChange={vi.fn()} readOnly />);
    expect(screen.getByText('Longsword')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /add attack/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /remove/i })).toBeNull();
  });
});
