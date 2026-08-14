/**
 * @fileoverview ChevronScroll tests
 * @description Verifies children render in a labelled tablist scroller with two
 * chevron buttons, and that both chevrons disable when the strip cannot scroll.
 *
 * @module tests/unit/src/lib/components/ui/chevronScroll/ChevronScroll
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { ChevronScroll } from '@/lib/components/ui/chevronScroll';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('ChevronScroll', () => {
  it('renders children in a labelled tablist scroller with two chevrons', () => {
    render(
      <ChevronScroll ariaLabel='Levels'>
        <button type='button'>1st</button>
        <button type='button'>2nd</button>
      </ChevronScroll>,
    );
    expect(screen.getByRole('tablist', { name: 'Levels' })).toBeTruthy();
    expect(screen.getByText('1st')).toBeTruthy();
    expect(screen.getByText('2nd')).toBeTruthy();
    expect(screen.getByLabelText('Scroll left')).toBeTruthy();
    expect(screen.getByLabelText('Scroll right')).toBeTruthy();
  });

  it('disables both chevrons when the strip cannot scroll', () => {
    render(
      <ChevronScroll>
        <button type='button'>only</button>
      </ChevronScroll>,
    );
    expect(
      (screen.getByLabelText('Scroll left') as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      (screen.getByLabelText('Scroll right') as HTMLButtonElement).disabled,
    ).toBe(true);
  });
});
