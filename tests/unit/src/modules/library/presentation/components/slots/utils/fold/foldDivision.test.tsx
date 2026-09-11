/**
 * @fileoverview foldDivision tests.
 * @module tests/unit/src/modules/library/presentation/components/slots/utils/fold/foldDivision.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import type { Division } from '@/modules/library/presentation/components/slots/utils/divisions';
import {
  disclosure,
  foldDivision,
} from '@/modules/library/presentation/components/slots/utils/fold/foldDivision';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

/**
 * A division of the shape the sheet hands over.
 *
 * @param {Partial<Division>} over - What to change about it.
 * @returns {Division} The division.
 */
const divisionOf = (over: Partial<Division> = {}): Division =>
  ({
    anchor: 'traits',
    name: 'Traits',
    rank: 3,
    heading: <h3 data-anchor='traits'>Traits</h3>,
    body: [<p key='a'>A passive.</p>],
    section: undefined,
    ...over,
  }) as unknown as Division;

describe('disclosure', () => {
  it('should open onto the body by default', () => {
    const { container } = render(
      <>{disclosure(<h3>Traits</h3>, <p>A passive.</p>, false)}</>,
    );
    expect(container.querySelector('details')).toHaveAttribute('open');
    expect(screen.getByText('A passive.')).toBeInTheDocument();
  });

  it('should start folded when asked', () => {
    const { container } = render(
      <>{disclosure(<h3>Traits</h3>, <p>A passive.</p>, true)}</>,
    );
    expect(container.querySelector('details')).not.toHaveAttribute('open');
  });

  it('should make the heading itself the control', () => {
    const { container } = render(
      <>{disclosure(<h3>Traits</h3>, <p>A passive.</p>, false)}</>,
    );
    const summary = container.querySelector('summary');
    expect(summary?.querySelector('h3')).toHaveTextContent('Traits');
  });
});

describe('foldDivision', () => {
  it('should give a bare division the section it lacked', () => {
    const { container } = render(
      <>{foldDivision(divisionOf(), <p>A passive.</p>, false)}</>,
    );
    const section = container.querySelector('section');
    expect(section).toHaveAttribute('data-anchor', 'traits');
    expect(section).toHaveAttribute('data-heading-level', '3');
    expect(section).toHaveAttribute('data-folded', 'true');
  });

  it('should keep the section a wrapped division arrived in', () => {
    const section = (
      <section data-anchor='traits' data-heading-level={3} className='kept'>
        <p>replaced</p>
      </section>
    );
    const { container } = render(
      <>
        {foldDivision(
          divisionOf({ section } as Partial<Division>),
          <p>A passive.</p>,
          false,
        )}
      </>,
    );

    const out = container.querySelector('section');
    expect(out).toHaveClass('kept');
    expect(out).toHaveAttribute('data-folded', 'true');
    expect(screen.queryByText('replaced')).not.toBeInTheDocument();
    expect(screen.getByText('A passive.')).toBeInTheDocument();
  });

  it('should fold the division closed when asked', () => {
    const { container } = render(
      <>{foldDivision(divisionOf(), <p>A passive.</p>, true)}</>,
    );
    expect(container.querySelector('details')).not.toHaveAttribute('open');
  });
});
