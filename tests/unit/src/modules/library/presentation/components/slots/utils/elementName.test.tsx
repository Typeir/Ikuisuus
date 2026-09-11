/**
 * @fileoverview Unit tests for the element name reader.
 *
 * @module tests/unit/src/modules/library/presentation/components/slots/utils/elementName.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-10
 */

import { ELEMENT_NAME_ATTRIBUTE } from '@/lib/constants/mdxElement';
import { elementNameOf } from '@/modules/library/presentation/components/slots/utils/elementName';
import React from 'react';
import { describe, expect, it } from 'vitest';

/**
 * A component with no readable name, the way a client component arrives on the
 * server.
 */
const Anonymous = (() => null) as React.FC;
Object.defineProperty(Anonymous, 'name', { value: '' });

describe('elementNameOf', () => {
  it('reads the name the compile step stamped', () => {
    const node = React.createElement(Anonymous, {
      [ELEMENT_NAME_ATTRIBUTE]: 'Feature',
    });

    expect(elementNameOf(node)).toBe('Feature');
  });

  it('falls back to the component for an element built in code', () => {
    const Named = (() => null) as React.FC;
    Named.displayName = 'Column';

    expect(elementNameOf(React.createElement(Named))).toBe('Column');
  });

  it('names an HTML tag, and nothing else', () => {
    expect(elementNameOf(React.createElement('p'))).toBe('p');
    expect(elementNameOf('text')).toBe('');
    expect(elementNameOf(null)).toBe('');
  });
});
