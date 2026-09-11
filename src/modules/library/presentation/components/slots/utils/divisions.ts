/**
 * @fileoverview Reads a sheet's divisions out of its compiled children.
 * @description A sheet is written as headings and read as divisions, and the
 * compiler hands those over in two shapes.
 *
 * @module modules/library/presentation/components/slots/utils/divisions
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-08
 */

import React, { type ReactElement, type ReactNode } from 'react';
import { headingLevelOf, isHeadingNode } from '../../headingParts';

/**
 * Props a compiled section or heading carries.
 *
 * @property {string} [data-anchor] - Anchor the node is addressed by
 * @property {number | string} [data-heading-level] - Rank of the section's heading
 * @property {ReactNode} [children] - The node's own children
 */
export interface DivisionProps {
  'data-anchor'?: string;
  'data-title'?: string;
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
 * @description The anchor is the slug of the heading it was cut from
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
 * What a heading says, when it says it in plain words.
 *
 * @description The anchor is the safe name, but it is a slug
 *
 * @param {ReactNode} heading - The heading node
 * @returns {string | null} The words, or null when they cannot be trusted
 */
export function wordsOf(heading: ReactNode): string | null {
  /* The words are read off the stamp the compiler left, never out of the
     heading's own children: those arrive whole on the server and in pieces in
     the browser, and a label built from them differs between the two renders,
     which is a hydration mismatch rather than a label. */
  if (!React.isValidElement<DivisionProps>(heading)) return null;
  const said = heading.props['data-title'];
  return typeof said === 'string' && said.trim() !== '' ? said.trim() : null;
}

/**
 * The run of siblings a children prop stands for.
 *
 * @description `React.Children.toArray` flattens arrays but not fragments, and
 * a single fragment is what a caller gets when the divisions were written as
 * one group.
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
 * rank of the heading it holds.
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
 * @description A heading of the same rank or higher starts the next division
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
          name: wordsOf(node) ?? titleOf(anchor),
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
        name: wordsOf(inner[at]) ?? titleOf(anchor),
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
 * division that holds another is two deep.
 *
 * @param {ReactNode} children - Siblings to measure
 * @returns {number} Depth, zero when nothing nests
 */
/**
 * Whether a node is a sheet in its own right.
 *
 * @description A sheet nested in another pages its own divisions, so the one
 * around it reads it as a single node and never rewrites what is inside.
 *
 * @param {ReactNode} node - Node to test
 * @returns {boolean} True when the node is a sheet
 */
export function isSheet(node: ReactNode): boolean {
  return (
    React.isValidElement(node) &&
    (node.type as { displayName?: string })?.displayName === 'Sheet'
  );
}

export function nestDepth(children: ReactNode): number {
  let deepest = 0;
  for (const node of siblingsOf(children)) {
    if (!React.isValidElement<DivisionProps>(node)) continue;
    /* A sheet inside a sheet pages its own divisions. They belong to its depth
       and not to this one's, and counting them would fold a whole sheet away
       behind a heading. */
    if (isSheet(node)) continue;
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
