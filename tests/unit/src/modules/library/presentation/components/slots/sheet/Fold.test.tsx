/**
 * @fileoverview Unit tests for the division fold.
 *
 * @module tests/unit/src/modules/library/presentation/components/slots/sheet/Fold.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-08
 */

import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import Fold from '@/modules/library/presentation/components/slots/sheet/Fold';

/**
 * A sheet shaped the way the compiler hands one over
 *
 * @returns {JSX.Element} The sheet's children
 */
function sheet(): React.JSX.Element {
  return (
    <>
      <h2 data-anchor='traits'>Traits</h2>
      <p>A passive.</p>
      <hr />
      <section data-anchor='features' data-heading-level={2}>
        <h2 data-anchor='features'>Features</h2>
        <section data-anchor='attacks' data-heading-level={3}>
          <h3 data-anchor='attacks'>Attacks</h3>
          <p>A swing.</p>
        </section>
      </section>
    </>
  );
}

describe('Fold', () => {
  it('folds every named division, wrapped or bare', () => {
    const { container } = render(
      <Fold sections='traits, features, attacks'>{sheet()}</Fold>,
    );

    expect(container.querySelectorAll('details')).toHaveLength(3);
    for (const anchor of ['traits', 'features', 'attacks']) {
      expect(
        container.querySelector(`[data-anchor="${anchor}"][data-folded]`),
      ).not.toBeNull();
    }
  });

  /* The heading carries the anchor, the rule and the pip that says what the
     division holds, so the fold moves it rather than replacing it. */
  it('keeps the heading itself as the control', () => {
    const { container } = render(<Fold sections='traits'>{sheet()}</Fold>);

    const heading = container.querySelector('summary h2');
    expect(heading).not.toBeNull();
    expect(heading?.getAttribute('data-anchor')).toBe('traits');
    expect(heading?.textContent).toBe('Traits');
  });

  it('takes a bare division down to the next rule', () => {
    const { container } = render(<Fold sections='traits'>{sheet()}</Fold>);

    const body = container.querySelector('details > div');
    expect(body?.querySelectorAll('p')).toHaveLength(1);
    expect(body?.querySelector('section')).toBeNull();
  });

  it('opens by default and closes when told to', () => {
    const open = render(<Fold sections='traits'>{sheet()}</Fold>);
    expect(open.container.querySelector('details')?.open).toBe(true);

    const shut = render(
      <Fold sections='traits' closed>
        {sheet()}
      </Fold>,
    );
    expect(shut.container.querySelector('details')?.open).toBe(false);
  });

  it('leaves the sheet alone when it names nothing', () => {
    const { container } = render(<Fold>{sheet()}</Fold>);

    expect(container.querySelectorAll('details')).toHaveLength(0);
    expect(container.querySelectorAll('h2')).toHaveLength(2);
  });
});
