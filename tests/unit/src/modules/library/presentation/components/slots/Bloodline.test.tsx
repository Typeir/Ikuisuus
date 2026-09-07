/**
 * @fileoverview Unit tests for the Bloodline card.
 * @description The card states the boon budget and hands the page's own
 * content through untouched, tables included.
 *
 * @module tests/unit/src/modules/library/presentation/components/slots/Bloodline.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-07
 */

import Bloodline from '@/modules/library/presentation/components/slots/Bloodline';
import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

describe('Bloodline', () => {
  it('prints the boon budget and keeps the page content', () => {
    const { container } = render(
      <Bloodline boonPoints='10'>
        <h2>Core Features</h2>
        <p>Body prose.</p>
      </Bloodline>,
    );
    const section = container.querySelector('[data-bloodline="true"]');
    expect(section).not.toBeNull();
    expect(container.querySelector('[data-slot="boonPoints"] [data-slot-value]')?.textContent).toBe('10');
    expect(container.querySelector('h2')?.textContent).toBe('Core Features');
    expect(container.querySelector('p:not([data-slot-grid])')?.textContent).toBe('Body prose.');
  });

  it('prints no slot grid when the page states no budget', () => {
    const { container } = render(
      <Bloodline>
        <p>Body prose.</p>
      </Bloodline>,
    );
    expect(container.querySelector('[data-slot-grid]')).toBeNull();
    expect(container.querySelector('[data-bloodline="true"]')?.textContent).toBe('Body prose.');
  });
});
