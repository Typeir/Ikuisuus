/**
 * @fileoverview Unit tests for the shared heading inspection helpers.
 *
 * @module tests/unit/src/modules/library/presentation/components/headingParts.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-02
 */

import React from 'react';
import { describe, expect, it } from 'vitest';
import {
  isHeadingNode,
  parseHeading,
  textOfNodes,
} from '@/modules/library/presentation/components/headingParts';

describe('headingParts', () => {
  it('recognises h1-h6 and mapped heading components', () => {
    expect(isHeadingNode(<h1>a</h1>)).toBe(true);
    expect(isHeadingNode(<h6>f</h6>)).toBe(true);
    expect(isHeadingNode(<p>not</p>)).toBe(false);
    const FakeH3 = ({ children }: { children?: React.ReactNode }) => (
      <h3>{children}</h3>
    );
    FakeH3.displayName = 'H3';
    expect(isHeadingNode(<FakeH3>mapped</FakeH3>)).toBe(true);
  });

  it('splits title, trailing tag, and anchor', () => {
    const parsed = parseHeading(
      <h6 data-anchor='mooncleave'>
        Mooncleave <span>Masterful Blow</span>
      </h6>,
    );
    expect(textOfNodes(parsed.titleNodes).trim()).toBe('Mooncleave');
    expect(parsed.cost).toBe('Masterful Blow');
    expect(parsed.anchor).toBe('mooncleave');
  });

  it('keeps heading without a tag whole', () => {
    const parsed = parseHeading(<h4 id='x'>Lunar Dissolution</h4>);
    expect(textOfNodes(parsed.titleNodes).trim()).toBe('Lunar Dissolution');
    expect(parsed.cost).toBeNull();
    expect(parsed.anchor).toBe('x');
  });

  it('flattens text out of nested children', () => {
    expect(
      textOfNodes([
        'a ',
        <strong key='b'>
          b <em>c</em>
        </strong>,
      ]),
    ).toBe('a b c');
  });
});
