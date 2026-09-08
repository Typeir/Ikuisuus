/**
 * @fileoverview Tests for the shared column reader.
 * @description Column and Row elements are found by display name through
 * paragraphs and fragments
 *
 * @module tests/unit/src/modules/library/presentation/components/slots/columns.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-07
 */

import { elementsNamed, type ColumnProps } from '@/modules/library/presentation/components/slots/columns';
import { Column, Row } from '@/modules/library/presentation/components/slots/Progression';
import React from 'react';
import { describe, expect, it } from 'vitest';

describe('elementsNamed', () => {
  it('finds elements by display name through paragraphs and fragments, in order', () => {
    const nodes = (
      <>
        <p>
          <Column label='A' values='1, 2' />
          {'\n'}
        </p>
        <Column label='B'>
          <Row at='3'>x</Row>
        </Column>
        <div>
          <Column label='hidden' />
        </div>
      </>
    );
    const columns = elementsNamed<ColumnProps>(nodes, 'Column');
    expect(columns.map((column) => column.props.label)).toEqual(['A', 'B']);
    expect(elementsNamed(columns[1].props.children, 'Row')).toHaveLength(1);
    expect(elementsNamed(nodes, 'Row')).toEqual([]);
  });

  it('returns nothing for text, null and unknown names', () => {
    expect(elementsNamed('text', 'Column')).toEqual([]);
    expect(elementsNamed(null, 'Column')).toEqual([]);
    expect(elementsNamed(<Column label='A' />, 'Table')).toEqual([]);
  });
});
