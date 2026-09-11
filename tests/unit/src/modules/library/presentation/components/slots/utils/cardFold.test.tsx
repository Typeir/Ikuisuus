/**
 * @fileoverview cardFold tests.
 * @module tests/unit/src/modules/library/presentation/components/slots/utils/cardFold.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import {
  CardFoldProvider,
  holdsCards,
  useCardFold,
} from '@/modules/library/presentation/components/slots/utils/cardFold';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

/**
 * Prints whether the surrounding sheet asked cards to collapse.
 *
 * @returns {React.JSX.Element} The answer.
 */
const Probe = (): React.JSX.Element => <span>{String(useCardFold())}</span>;

describe('useCardFold', () => {
  it('should say no when nothing has asked', () => {
    render(<Probe />);
    expect(screen.getByText('false')).toBeInTheDocument();
  });

  it('should say yes inside a sheet that asked', () => {
    render(
      <CardFoldProvider value={true}>
        <Probe />
      </CardFoldProvider>,
    );
    expect(screen.getByText('true')).toBeInTheDocument();
  });

  it('should take the nearest answer when providers nest', () => {
    render(
      <CardFoldProvider value={true}>
        <CardFoldProvider value={false}>
          <Probe />
        </CardFoldProvider>
      </CardFoldProvider>,
    );
    expect(screen.getByText('false')).toBeInTheDocument();
  });
});

describe('holdsCards', () => {
  it('should find nothing in an empty run', () => {
    expect(holdsCards([])).toBe(false);
  });

  it('should find nothing in plain prose', () => {
    expect(holdsCards(['some words', <p key='a'>and more</p>])).toBe(false);
  });

  it('should find a card standing at the top of the run', () => {
    expect(holdsCards([<div key='a' data-entry='trait' />])).toBe(true);
  });

  it('should find a card buried in the run', () => {
    const nodes = [
      <p key='a'>prose</p>,
      <section key='b'>
        <div>
          <article data-entry='feature'>a feature</article>
        </div>
      </section>,
    ];
    expect(holdsCards(nodes)).toBe(true);
  });

  it('should count a card whose marking is empty', () => {
    expect(holdsCards([<div key='a' data-entry='' />])).toBe(true);
  });

  it('should ignore text and nullish nodes', () => {
    expect(holdsCards([null, undefined, false, 0, 'text'])).toBe(false);
  });
});
