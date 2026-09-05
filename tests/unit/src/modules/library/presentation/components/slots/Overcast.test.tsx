/**
 * @fileoverview Unit tests for the overcast slot.
 * @description The slot renders as a row for a phrase and as a titled block
 * for block content; the author chooses by how they write it.
 *
 * @module tests/unit/src/modules/library/presentation/components/slots/Overcast.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-05
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import Overcast from '@/modules/library/presentation/components/slots/Overcast';

describe('Overcast', () => {
  it('renders a phrase as a slot row', () => {
    render(<Overcast>the spell gains 1d6 damage</Overcast>);
    const row = document.querySelector('[data-slot="overcast"]');
    expect(row).not.toBeNull();
    expect(row?.textContent).toContain('the spell gains 1d6 damage');
    expect(document.querySelector('[data-overcast]')).toBeNull();
  });

  it('keeps a phrase that arrives as several inline nodes on one row', () => {
    render(
      <Overcast>
        the weapon gains <strong>1d4</strong> damage
      </Overcast>,
    );
    expect(document.querySelector('[data-slot="overcast"]')).not.toBeNull();
    expect(document.querySelector('[data-overcast]')).toBeNull();
  });

  it('renders block content as a titled block', () => {
    render(
      <Overcast at='5th+'>
        <p>The weapon gains access to the Somatic damage strata.</p>
        <table>
          <tbody>
            <tr>
              <td>chemical</td>
            </tr>
          </tbody>
        </table>
      </Overcast>,
    );
    const block = document.querySelector('[data-overcast]');
    expect(block).not.toBeNull();
    expect(block?.getAttribute('data-overcast-at')).toBe('5th+');
    expect(block?.querySelector('[data-slot-label]')?.textContent).toContain(
      '(5th+)',
    );
    expect(screen.getByText('chemical')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="overcast"]')).toBeNull();
  });

  it('adds the tier to a row label as well', () => {
    render(<Overcast at='7th+'>the effect doubles</Overcast>);
    expect(
      document.querySelector('[data-slot="overcast"] [data-slot-label]')
        ?.textContent,
    ).toContain('(7th+)');
  });
});
