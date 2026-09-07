/**
 * @fileoverview Column and Row declarations shared by the declared tables.
 * @module modules/library/presentation/components/slots/columns
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-07
 */

import React, { type ReactNode } from 'react';
import { cleanChildren } from './slotElements';

/**
 * Props of a column: a label, and either a comma-separated value list or Row children.
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
 * Props of a row: which table row it belongs to, whether it stays there, and its value.
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
    const type = node.type as { displayName?: string; name?: string } | string;
    const typeName = typeof type === 'string' ? type : type.displayName || type.name || '';
    if (typeName === name) {
      out.push(node as React.ReactElement<P>);
    } else if (typeName === 'p' || typeName === '' || type === React.Fragment) {
      out.push(...elementsNamed<P>((node.props as { children?: ReactNode }).children, name));
    }
  }
  return out;
}
