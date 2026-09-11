/**
 * @fileoverview Column and Row declarations shared by the declared tables.
 * @module modules/library/presentation/components/slots/utils/columns
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-07
 */

import React, { type ReactNode } from 'react';
import { elementNameOf } from './elementName';
import { cleanChildren } from './slotElements';

/**
 * Props of a column
 *
 * @property {string} label - Column heading
 * @property {string} [values] - Comma-separated values, one per table row from the first
 * @property {ReactNode} [children] - Row elements
 */
export interface ColumnProps {
  label: string;
  values?: string;
  children?: ReactNode;
}

/**
 * Props of a row
 *
 * @property {string | number} [at] - Row key the value starts at
 * @property {unknown} [unique] - Print at this row only
 * @property {ReactNode} [children] - Value
 */
export interface RowProps {
  at?: string | number;
  unique?: unknown;
  children?: ReactNode;
}

/**
 * Elements of one component type among nodes, looking through paragraphs
 * and fragments.
 *
 * @param {ReactNode} nodes - Nodes
 * @param {string} name - Component display name
 * @returns {React.ReactElement<P>[]} Matching elements in order
 */
export function elementsNamed<P>(nodes: ReactNode, name: string): React.ReactElement<P>[] {
  const out: React.ReactElement<P>[] = [];
  for (const node of cleanChildren(nodes)) {
    if (!React.isValidElement(node)) continue;
    const typeName = elementNameOf(node);
    if (typeName === name) {
      out.push(node as React.ReactElement<P>);
    } else if (typeName === 'p' || typeName === '' || node.type === React.Fragment) {
      out.push(...elementsNamed<P>((node.props as { children?: ReactNode }).children, name));
    }
  }
  return out;
}
