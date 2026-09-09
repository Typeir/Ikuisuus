/**
 * @fileoverview Folds named divisions of a sheet into disclosures.
 * @description A long sheet is easier to skim when its divisions collapse.
 *
 * @module modules/library/presentation/components/slots/Fold
 * @version 1.1.0
 * @author Typeir
 * @since 2026-09-08
 */

'use client';

import React, { type ReactNode } from 'react';
import {
  anchorsOf,
  byAnchor,
  readDivisions,
  type DivisionProps,
} from './divisions';
import { foldDivision } from './foldDivision';

/**
 * Props for the fold.
 *
 * @property {string} [sections] - Anchors of the divisions to fold, comma separated
 * @property {boolean} [closed] - Start folded away; open by default
 * @property {ReactNode} [children] - The sheet's divisions
 */
export interface FoldProps {
  sections?: string;
  closed?: boolean;
  children?: ReactNode;
}

/**
 * Walks a run of siblings, folding the divisions the caller named.
 *
 * @description A node that is not a named division is still walked, since a
 * named division may sit anywhere beneath it.
 *
 * @param {ReactNode} children - Nodes to walk
 * @param {Set<string>} anchors - Anchors to fold
 * @param {boolean} closed - Whether folds start closed
 * @returns {ReactNode} The run, with named divisions folded
 */
function walk(
  children: ReactNode,
  anchors: Set<string>,
  closed: boolean,
): ReactNode {
  return readDivisions(children, byAnchor(anchors)).map((part, index) => {
    if (part.kind === 'division') {
      const body = walk(part.division.body, anchors, closed);
      return (
        <React.Fragment key={part.division.anchor}>
          {foldDivision(part.division, body, closed)}
        </React.Fragment>
      );
    }

    const node = part.node;
    if (!React.isValidElement<DivisionProps>(node)) return node;
    if (node.props.children === undefined) return node;

    return React.cloneElement(node, {
      ...node.props,
      key: node.key ?? index,
      children: walk(node.props.children, anchors, closed),
    } as DivisionProps);
  });
}

/**
 * Fold component.
 *
 * @param {FoldProps} props - Component props
 * @returns {JSX.Element} The sheet with its named divisions folded
 */
const Fold: React.FC<FoldProps> = ({ sections, closed = false, children }) => {
  const anchors = anchorsOf(sections);
  if (anchors.size === 0) return <>{children}</>;
  return <>{walk(children, anchors, closed)}</>;
};

Fold.displayName = 'Fold';

export default Fold;
