/**
 * @fileoverview Unit tests for the Boons section.
 * @description The budget hangs off the section's own heading, and every
 * bloodline grants the same one unless it says otherwise.
 *
 * @module tests/unit/src/modules/library/presentation/components/slots/Boons.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-07
 */

import Boons from '@/modules/library/presentation/components/slots/Boons';
import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

describe('Boons', () => {
  it('tags the section heading with the default budget', () => {
    const { container } = render(
      <Boons>
        <h2>Boons</h2>
        <p>A boon.</p>
      </Boons>,
    );
    const tag = container.querySelector('[data-boon-budget]');
    expect(tag).toHaveAttribute('data-boon-budget', '10');
    expect(tag?.parentElement?.tagName).toBe('H2');
    expect(tag?.parentElement?.textContent).toContain('Boons');
  });

  it('takes a budget of its own when the bloodline departs from the default', () => {
    const { container } = render(
      <Boons points='14'>
        <h2>Boons</h2>
      </Boons>,
    );
    expect(container.querySelector('[data-boon-budget]')).toHaveAttribute('data-boon-budget', '14');
  });

  it('tags the first heading only, and keeps the rest of the section', () => {
    const { container } = render(
      <Boons>
        <h2>Boons</h2>
        <h3>A boon</h3>
        <p>Prose.</p>
      </Boons>,
    );
    expect(container.querySelectorAll('[data-boon-budget]')).toHaveLength(1);
    expect(container.querySelector('h3')?.querySelector('[data-boon-budget]')).toBeNull();
    expect(container.querySelector('[data-boons="true"]')?.textContent).toContain('Prose.');
  });
});
