/**
 * @fileoverview Tests for the heirloom attributes marker.
 *
 * @module tests/unit/src/modules/library/presentation/components/slots/Attributes.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-03
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import Attributes, {
  HeirloomValuesContext,
  type HeirloomValues,
} from '@/modules/library/presentation/components/slots/Attributes';

/**
 * Renders the marker inside an heirloom carrying the given values.
 *
 * @param {HeirloomValues} values - Header slot values
 * @param {string} [only] - Slot names to narrow to
 * @returns {HTMLElement} The container
 */
function renderIn(values: HeirloomValues, only?: string): HTMLElement {
  const { container } = render(
    <HeirloomValuesContext.Provider value={values}>
      <Attributes only={only} />
    </HeirloomValuesContext.Provider>,
  );
  return container;
}

/**
 * Slot names printed, in the order they appear.
 *
 * @param {HTMLElement} container - Rendered container
 * @returns {string[]} Slot names
 */
const printed = (container: HTMLElement): string[] =>
  [...container.querySelectorAll('[data-slot]')].map(
    (row) => row.getAttribute('data-slot') ?? '',
  );

describe('Attributes', () => {
  it('prints the numbers the item carries, in schema order', () => {
    const container = renderIn({
      burden: '[= 2 burden =]',
      damage: '1d10 slashing',
      mastery: 'Slow',
    });
    expect(printed(container)).toEqual(['damage', 'mastery', 'burden']);
    expect(screen.getByText('Slow')).toBeInTheDocument();
  });

  it('renders nothing when the item carries no numbers', () => {
    const container = renderIn({ rarity: 'very rare', attunement: 'required' });
    expect(container.querySelector('[data-heirloom-stats]')).toBeNull();
  });

  it('renders nothing outside an heirloom', () => {
    const { container } = render(<Attributes />);
    expect(container.querySelector('[data-heirloom-stats]')).toBeNull();
  });

  it('rides versatile inside the damage cell rather than giving it a row', () => {
    const container = renderIn({ damage: '1d10 slashing', versatile: '1d12' });
    expect(printed(container)).toEqual(['damage']);
    const damage = container.querySelector('[data-slot="damage"]');
    expect(damage?.textContent).toContain('1d10 slashing');
    expect(damage?.textContent).toContain('1d12');
  });

  it('narrows to the requested slots, keeping schema order', () => {
    const values: HeirloomValues = {
      damage: '1d10',
      reach: '[= 1 stride =]',
      mastery: 'Slow',
      burden: '[= 2 burden =]',
    };
    expect(printed(renderIn(values, 'burden damage'))).toEqual([
      'damage',
      'burden',
    ]);
    expect(printed(renderIn(values, 'burden, damage'))).toEqual([
      'damage',
      'burden',
    ]);
  });

  it('ignores a requested slot the item does not carry', () => {
    const container = renderIn({ damage: '1d10' }, 'damage stealth');
    expect(printed(container)).toEqual(['damage']);
  });
});
