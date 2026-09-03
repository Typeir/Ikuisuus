/**
 * @fileoverview Unit tests for the slot elements.
 *
 * @module tests/unit/src/modules/library/presentation/components/slots/slotElements.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-02
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import {
  Attunement,
  Cost,
  isSlotNode,
  slotNameOf,
  SlotRow,
  Targets,
} from '@/modules/library/presentation/components/slots/slotElements';

describe('slot elements', () => {
  it('identifies slot nodes by displayName', () => {
    expect(slotNameOf(<Cost>1</Cost>)).toBe('cost');
    expect(slotNameOf(<Targets>you</Targets>)).toBe('targets');
    expect(slotNameOf(<Attunement>required</Attunement>)).toBe('attunement');
    expect(isSlotNode(<Cost>1</Cost>)).toBe(true);
  });

  it('rejects non-slot nodes', () => {
    expect(slotNameOf(<span>x</span>)).toBeNull();
    expect(slotNameOf('text')).toBeNull();
    expect(isSlotNode(<div />)).toBe(false);
  });

  it('renders a slot row with label key and value', () => {
    render(
      <SlotRow name='cost'>1 Minor Action</SlotRow>,
    );
    const slot = screen.getByText('1 Minor Action').closest('[data-slot]');
    expect(slot).toHaveAttribute('data-slot', 'cost');
    expect(slot?.querySelector('[data-slot-label]')?.textContent).toBe(
      'slots.cost',
    );
  });

  it('slot components render the same row structure', () => {
    render(<Cost>1 Major Action</Cost>);
    const slot = screen.getByText('1 Major Action').closest('[data-slot]');
    expect(slot).toHaveAttribute('data-slot', 'cost');
    expect(slot?.querySelector('[data-slot-label]')).toBeTruthy();
  });
});
