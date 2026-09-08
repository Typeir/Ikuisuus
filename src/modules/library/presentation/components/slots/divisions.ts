/**
 * @fileoverview Reads a sheet's divisions out of its compiled children.
 * @description A sheet is written as headings and read as divisions, and the
 * compiler hands those over in two shapes. Most divisions arrive as a section
 * that holds its own heading. The first heading inside a component is left
 * unsectioned so that the component can use it as its summary, so a division
 * that opens a shell arrives bare, with the rest of the division following it
 * as siblings. Every presentation that reshapes a sheet — folding it, paging
 * it — needs both shapes read the same way, which is what this does.
 *
 * @module modules/library/presentation/components/slots/divisions
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-08
 */

import React, { type ReactElement, type ReactNode } from 'react';
import { headingLevelOf, isHeadingNode } from '../headingParts';

/**
 * Props a compiled section or heading carries.
 *
 * @property {string} [data-anchor] - Anchor the node is addressed by
 * @property {number | string} [data-heading-level] - Rank of the section's heading
 * @property {ReactNode} [children] - The node's own children
 */
export interface DivisionProps {
  'data-anchor'?: string;
  'data-heading-level'?: number | string;
  children?: ReactNode;
}

/**
 * One division of a sheet.
 *
 * @property {string} anchor - Anchor the division is addressed by
 * @property {string} name - Label for the division, read from its anchor
 * @property {number} rank - Heading rank the division opens at
 * @property {ReactNode} heading - The heading element, untouched
 * @property {ReactNode[]} body - Everything the division holds below its heading
 * @property {ReactElement<DivisionProps> | null} section - Wrapping section, when the
 * division came wrapped in one
 */
export interface Division {
  anchor: string;
  name: string;
  rank: number;
  heading: ReactNode;
  body: ReactNode[];
  section: ReactElement<DivisionProps> | null;
}

/**
 * A division, or a node that is not one.
 */
export type SheetPart =
  | { kind: 'division'; division: Division }
  | { kind: 'loose'; node: ReactNode };

/**
 * One entry of an anchor list, which is either a bare anchor or an anchor and
 * the label to print for it.
 *
 * @param {string} entry - The written entry
 * @returns {[string, string | null]} The anchor and its label, if it was given
 */
function splitEntry(entry: string): [string, string | null] {
  const at = entry.indexOf(':');
  if (at === -1) return [entry.trim().toLowerCase(), null];
  return [
    entry.slice(0, at).trim().toLowerCase(),
    entry.slice(at + 1).trim() || null,
  ];
}

/**
 * The entries a comma separated anchor list names.
 *
 * @param {string | undefined} list - Comma separated anchors, each optionally
 * followed by `: Label`
 * @returns {[string, string | null][]} Anchors in the order written
 */
function entriesOf(list: string | undefined): [string, string | null][] {
  return (list ?? '')
    .split(',')
    .map(splitEntry)
    .filter(([anchor]) => anchor !== '');
}

/**
 * The anchors a comma separated list names.
 *
 * @param {string | undefined} list - Comma separated anchors
 * @returns {Set<string>} The anchors, lowercased
 */
export function anchorsOf(list: string | undefined): Set<string> {
  return new Set(entriesOf(list).map(([anchor]) => anchor));
}

/**
 * The labels a comma separated list gives its anchors.
 *
 * @param {string | undefined} list - Comma separated anchors, each optionally
 * followed by `: Label`
 * @returns {Map<string, string>} Anchors that were given a label of their own
 */
export function labelsOf(list: string | undefined): Map<string, string> {
  const labels = new Map<string, string>();
  for (const [anchor, label] of entriesOf(list)) {
    if (label) labels.set(anchor, label);
  }
  return labels;
}

/**
 * The label an anchor stands for.
 *
 * @description The anchor is the slug of the heading it was cut from, so
 * unslugging it gives the heading back. The heading's own text is not read,
 * because a division rendered on the server reaches a client slot with parts of
 * itself still unresolved, and a label built from that would lose letters.
 *
 * @param {string} anchor - Anchor to read
 * @returns {string} The label
 */
export function titleOf(anchor: string): string {
  return anchor
    .split('-')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * The run of siblings a children prop stands for.
 *
 * @description `React.Children.toArray` flattens arrays but not fragments, and
 * a single fragment is what a caller gets when the divisions were written as
 * one group. Descending through it puts both shapes on the same footing.
 *
 * @param {ReactNode} children - The children prop
 * @returns {ReactNode[]} The siblings
 */
function siblingsOf(children: ReactNode): ReactNode[] {
  const nodes = React.Children.toArray(children);
  if (nodes.length !== 1) return nodes;
  const only = nodes[0];
  if (
    React.isValidElement<DivisionProps>(only) &&
    only.type === React.Fragment
  ) {
    return siblingsOf(only.props.children);
  }
  return nodes;
}

/**
 * The anchor a node claims.
 *
 * @param {ReactNode} node - Node to read
 * @returns {string | null} The anchor, or null when the node claims none
 */
function anchorOf(node: ReactNode): string | null {
  if (!React.isValidElement<DivisionProps>(node)) return null;
  return node.props['data-anchor'] ?? null;
}

/**
 * The heading rank a node stands at.
 *
 * @description A heading stands at its own rank and a section stands at the
 * rank of the heading it holds. A node that carries no heading, such as the
 * anonymous section a rule opens, stands at no rank at all.
 *
 * @param {ReactNode} node - Node to read
 * @returns {number | null} Rank 1-6, or null when the node holds no heading
 */
function rankOf(node: ReactNode): number | null {
  if (isHeadingNode(node)) return headingLevelOf(node);
  if (!React.isValidElement<DivisionProps>(node)) return null;
  const level = Number(node.props['data-heading-level']);
  return Number.isFinite(level) && level > 0 ? level : null;
}

/**
 * Whether a node ends the division a bare heading opened.
 *
 * @description A heading of the same rank or higher starts the next division,
 * and a rule ends the current one outright — which is why the compiler clears
 * its section stack when it meets one.
 *
 * @param {ReactNode} node - Node to test
 * @param {number} rank - Rank of the heading that opened the division
 * @returns {boolean} True when the division ends before this node
 */
function ends(node: ReactNode, rank: number): boolean {
  if (React.isValidElement(node) && node.type === 'hr') return true;
  const own = rankOf(node);
  return own !== null && own <= rank;
}

/**
 * Tells whether one division is the kind a caller wants.
 */
export type DivisionTest = (anchor: string, rank: number) => boolean;

/**
 * Matches the divisions a list names.
 *
 * @param {Set<string>} anchors - Anchors to match
 * @returns {DivisionTest} The test
 */
export function byAnchor(anchors: Set<string>): DivisionTest {
  return (anchor) => anchors.has(anchor.toLowerCase());
}

/**
 * Matches every division written at one heading rank.
 *
 * @param {number} rank - Heading rank, 1-6
 * @returns {DivisionTest} The test
 */
export function byRank(rank: number): DivisionTest {
  return (_anchor, own) => own === rank;
}

/**
 * Matches every division.
 *
 * @returns {boolean} Always true
 */
export const anyDivision: DivisionTest = () => true;

/**
 * Splits a run of siblings into the divisions the caller wants and the nodes
 * that are not divisions.
 *
 * @description Order is kept, so a caller that only wants to rewrite some
 * divisions can rebuild the run exactly as it was given.
 *
 * @param {ReactNode} children - Siblings to read
 * @param {DivisionTest} wanted - Which divisions to take
 * @returns {SheetPart[]} The run, in order
 */
export function readDivisions(
  children: ReactNode,
  wanted: DivisionTest,
): SheetPart[] {
  const nodes = siblingsOf(children);
  const parts: SheetPart[] = [];

  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    const anchor = anchorOf(node);
    const rank = rankOf(node);

    if (anchor === null || rank === null || !wanted(anchor, rank)) {
      parts.push({ kind: 'loose', node });
      continue;
    }

    if (isHeadingNode(node)) {
      let end = index + 1;
      while (end < nodes.length && !ends(nodes[end], rank)) end += 1;
      parts.push({
        kind: 'division',
        division: {
          anchor,
          name: titleOf(anchor),
          rank,
          heading: node,
          body: nodes.slice(index + 1, end),
          section: null,
        },
      });
      index = end - 1;
      continue;
    }

    const section = node as ReactElement<DivisionProps>;
    const inner = React.Children.toArray(section.props.children);
    const at = inner.findIndex((child) => isHeadingNode(child));
    if (at === -1) {
      parts.push({ kind: 'loose', node });
      continue;
    }

    parts.push({
      kind: 'division',
      division: {
        anchor,
        name: titleOf(anchor),
        rank,
        heading: inner[at],
        body: inner.filter((_, position) => position !== at),
        section,
      },
    });
  }

  return parts;
}

/**
 * How many divisions deep a run of siblings goes.
 *
 * @description A run that holds no division at all is flat; one holding a
 * division that holds another is two deep. This is what says whether a block
 * is a holder worth collapsing or a leaf that would collapse to nothing.
 *
 * @param {ReactNode} children - Siblings to measure
 * @returns {number} Depth, zero when nothing nests
 */
export function nestDepth(children: ReactNode): number {
  let deepest = 0;
  for (const node of siblingsOf(children)) {
    if (!React.isValidElement<DivisionProps>(node)) continue;
    const inner = nestDepth(node.props.children);
    /* A card's own heading is not a level of its own, and the card that holds
       it has not drawn it yet — the depth is read off the anchors the compiler
       stamped, which are there either way. */
    const own =
      node.props['data-anchor'] !== undefined &&
      rankOf(node) !== null &&
      !isHeadingNode(node);
    deepest = Math.max(deepest, own ? inner + 1 : inner);
  }
  return deepest;
}
