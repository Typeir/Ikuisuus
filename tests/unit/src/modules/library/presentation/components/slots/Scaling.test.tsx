/**
 * @fileoverview Unit tests for the Scaling block.
 * @description A cantrip grows at character levels rather than by being cast
 * from a higher slot
 *
 * @module tests/unit/src/modules/library/presentation/components/slots/Scaling.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-07
 */

import Scaling from '@/modules/library/presentation/components/slots/Scaling';
import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

describe('Scaling', () => {
  it('names the block once, above what it holds', () => {
    const { container } = render(
      <Scaling>
        <p>
          <strong>(5th/11th/17th):</strong> the damage doubles at each step.
        </p>
      </Scaling>,
    );
    const block = container.querySelector('section[data-scaling]');
    expect(block).not.toBeNull();
    expect(
      block?.querySelector('[data-scaling-label]')?.textContent,
    ).toBeTruthy();
    expect(block?.textContent).toContain('the damage doubles at each step.');
  });

  it('does not label itself as a slot, having no slot to name', () => {
    const { container } = render(
      <Scaling>
        <p>Prose.</p>
      </Scaling>,
    );
    expect(container.querySelector('[data-slot-label]')).toBeNull();
  });
});
