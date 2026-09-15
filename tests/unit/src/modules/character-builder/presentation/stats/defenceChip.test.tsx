/**
 * @fileoverview DefenceChip Unit Tests
 * @description The chip prints the Defence total from its two parts and opens
 * both parts for editing when unlocked.
 *
 * @module tests/unit/src/modules/character-builder/presentation/stats/defenceChip.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-16
 */

import { DefenceChipMemo } from '@/modules/character-builder/presentation/stats/defenceChip';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('DefenceChip', () => {
  it('renders the Defence total and both parts when locked', () => {
    const { container } = render(
      <DefenceChipMemo
        deflect={5}
        dodge={2}
        isUnlocked={() => false}
        toggle={vi.fn()}
        onDeflect={vi.fn()}
        onDodge={vi.fn()}
      />,
    );
    expect(screen.getByText('defence')).toBeInTheDocument();
    expect(container.querySelector('[data-defence-total]')).toHaveTextContent('17');
    expect(container.querySelector('[data-defence-parts]')).toHaveTextContent('5');
    expect(container.querySelector('[data-defence-parts]')).toHaveTextContent('2');
  });

  it('lets the total fall below the base when a part is negative', () => {
    const { container } = render(
      <DefenceChipMemo
        deflect={0}
        dodge={-2}
        isUnlocked={() => false}
        toggle={vi.fn()}
        onDeflect={vi.fn()}
        onDodge={vi.fn()}
      />,
    );
    expect(container.querySelector('[data-defence-total]')).toHaveTextContent('8');
  });

  it('shows an input per part when unlocked and writes each on change', () => {
    const onDeflect = vi.fn();
    const onDodge = vi.fn();
    render(
      <DefenceChipMemo
        deflect={5}
        dodge={2}
        isUnlocked={() => true}
        toggle={vi.fn()}
        onDeflect={onDeflect}
        onDodge={onDodge}
      />,
    );
    const deflect = screen.getByLabelText('deflect');
    const dodge = screen.getByLabelText('dodge');
    expect(deflect).toBeInTheDocument();
    expect(dodge).toBeInTheDocument();
    fireEvent.change(deflect, { target: { value: '6' } });
    fireEvent.change(dodge, { target: { value: '3' } });
    expect(onDeflect).toHaveBeenCalledWith(6);
    expect(onDodge).toHaveBeenCalledWith(3);
  });
});
