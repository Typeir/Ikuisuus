/**
 * @fileoverview sheetFolding Tests
 * @module tests/unit/src/modules/library/presentation/components/slots/sheetFolding.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import {
  TURN_BACKSTOP,
  isCard,
  rebuild,
} from '@/modules/library/presentation/components/slots/sheetFolding';
import { render, screen } from '@testing-library/react';
import React, { type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

/**
 * A node shaped like a division, for the tests that only read its props.
 *
 * @param {Record<string, unknown>} props - Props to put on the node.
 * @returns {ReactElement} The node.
 */
const nodeWith = (props: Record<string, unknown>): ReactElement =>
  React.createElement('div', props);
describe('isCard', () => {
  it('should treat a node carrying a kind or an entry as a card', () => {
    expect(isCard(nodeWith({ 'data-kind': 'trait' }))).toBe(true);
    expect(isCard(nodeWith({ 'data-entry': '' }))).toBe(true);
  });

  it('should treat a plain division as not a card', () => {
    expect(isCard(nodeWith({ 'data-anchor': 'traits' }))).toBe(false);
  });
});

describe('rebuild', () => {
  it('should wrap a heading and body in a section carrying the anchor', () => {
    const { container } = render(
      <>
        {rebuild(
          {
            anchor: 'traits',
            rank: 2,
            heading: <h2>Traits</h2>,
            body: <p>body</p>,
            section: null,
          } as never,
          <p>body</p>,
        )}
      </>,
    );

    const section = container.querySelector('section');
    expect(section).not.toBeNull();
    expect(section?.getAttribute('data-anchor')).toBe('traits');
    expect(section?.getAttribute('data-heading-level')).toBe('2');
    expect(screen.getByText('Traits')).toBeInTheDocument();
  });
});
