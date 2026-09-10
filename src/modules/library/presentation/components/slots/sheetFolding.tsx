/**
 * @fileoverview How a sheet's page decides what to fold and how long to wait.
 * @description The parts of a sheet that read its divisions and put them back
 * together
 *
 * @module modules/library/presentation/components/slots/sheetFolding
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-09
 */

import React, { type ReactElement, type ReactNode } from 'react';
import {
  anyDivision,
  isSheet,
  nestDepth,
  readDivisions,
  type Division,
  type DivisionProps,
} from './divisions';
import { foldDivision } from './foldDivision';


/**
 * Whether a node is a rendered card rather than a division of the sheet.
 *
 * @description A card owns its heading, its slot rows and its body, and
 * reading those as divisions would lift the heading out of the card it titles.
 *
 * @param {ReactElement<DivisionProps>} node - Node to test
 * @returns {boolean} True when the node is a card
 */
export function isCard(node: ReactElement<DivisionProps>): boolean {
  const props = node.props as Record<string, unknown>;
  return props['data-kind'] !== undefined || props['data-entry'] !== undefined;
}

/**
 * Puts a division back together around a body that was walked.
 *
 * @param {Division} division - The division
 * @param {ReactNode} body - Its walked body
 * @returns {ReactNode} The division
 */
export function rebuild(division: Division, body: ReactNode): ReactNode {
  const content = (
    <>
      {division.heading}
      {body}
    </>
  );
  if (division.section) {
    return React.cloneElement(
      division.section,
      { ...division.section.props },
      content,
    );
  }
  return (
    <section data-anchor={division.anchor} data-heading-level={division.rank}>
      {content}
    </section>
  );
}

/**
 * Collapses everything on a page that holds divisions of its own.
 *
 * @description A block that nests deeply enough is a holder, and a holder is
 * worth a heading and nothing more until it is asked for.
 *
 * @param {ReactNode} children - Nodes to walk
 * @param {number} nest - Depth at which a division starts collapsing
 * @param {boolean} closed - Whether the folds start closed
 * @returns {ReactNode} The run, with its holders folded
 */
export function foldHolders(
  children: ReactNode,
  nest: number,
  closed: boolean,
): ReactNode {
  return readDivisions(children, anyDivision).map((part, index) => {
    if (part.kind === 'division') {
      const { division } = part;
      const body = foldHolders(division.body, nest, closed);
      const deep = nestDepth(division.body) >= nest;
      return (
        <React.Fragment key={division.anchor}>
          {deep
            ? foldDivision(division, body, closed)
            : rebuild(division, body)}
        </React.Fragment>
      );
    }

    const node = part.node;
    if (!React.isValidElement<DivisionProps>(node)) return node;
    /* A sheet nested in another keeps its own insides. */
    if (isSheet(node)) return node;
    /* A card is left whole. Its heading has not been drawn yet — the block
       that draws it reads it out of these same children — so rewriting them
       would take the heading away from it. Collapsing a card is the card's
       own to do, asked for through context. */
    if (node.props.children === undefined || isCard(node)) return node;

    return React.cloneElement(node, {
      ...node.props,
      key: node.key ?? index,
      children: foldHolders(node.props.children, nest, closed),
    } as DivisionProps);
  });
}
