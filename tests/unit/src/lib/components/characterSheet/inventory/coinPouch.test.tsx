/**
 * @fileoverview CoinPouch Unit Tests
 * @description Smoke tests for the CoinPouch component.
 *
 * @module tests/unit/lib/components/characterSheet/coinPouch
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { CoinPouch } from '@/lib/components/characterSheet/inventory/coinPouch';
import { createEmptyCharacter } from '@/lib/utils/characterStorage';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('CoinPouch', () => {
  it('migrates legacy currency into a Gold Standard holdings card', () => {
    const data = {
      ...createEmptyCharacter(),
      currency: { pp: 1, gp: 5, ep: 0, sp: 10, cp: 50 },
      coinHoldings: [],
    };
    render(<CoinPouch data={data} editing={false} onChange={vi.fn()} />);
    expect(screen.getByText('Gold Standard')).toBeTruthy();
    expect(screen.getAllByText(/Gold/).length).toBeGreaterThan(0);
  });

  it('renders existing coinHoldings without falling back to legacy currency', () => {
    const data = {
      ...createEmptyCharacter(),
      coinHoldings: [
        {
          systemName: 'Gold Standard',
          counts: { Gold: 7 },
        },
      ],
    };
    render(<CoinPouch data={data} editing={false} onChange={vi.fn()} />);
    expect(screen.getByText('Gold Standard')).toBeTruthy();
    const goldInput = screen
      .getAllByRole('spinbutton')
      .find((el) => (el as HTMLInputElement).value === '7');
    expect(goldInput).toBeTruthy();
  });

  it('emits a coinHoldings patch when a count changes in edit mode', () => {
    const data = {
      ...createEmptyCharacter(),
      coinHoldings: [
        {
          systemName: 'Gold Standard',
          counts: { Gold: 5 },
        },
      ],
    };
    const handle = vi.fn();
    render(<CoinPouch data={data} editing={true} onChange={handle} />);
    const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    const goldInput = inputs.find((el) => el.value === '5');
    expect(goldInput).toBeTruthy();
    fireEvent.change(goldInput!, { target: { value: '12' } });

    expect(handle).toHaveBeenCalled();
    const patch = handle.mock.calls[0][0];
    expect(patch.coinHoldings[0].counts.Gold).toBe(12);
  });

  it('exposes an Add system button only when editing', () => {
    const data = createEmptyCharacter();
    const { rerender } = render(
      <CoinPouch data={data} editing={false} onChange={vi.fn()} />,
    );
    expect(screen.queryByLabelText('Add currency system')).toBeNull();
    rerender(<CoinPouch data={data} editing={true} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Add currency system')).toBeTruthy();
  });
});
