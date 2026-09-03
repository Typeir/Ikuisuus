/**
 * @fileoverview Shared MDX heading inspection helpers.
 * @description Extracted from Collapsible so the slot card components and
 * Collapsible agree on what counts as a heading and how a heading splits into
 * title, trailing tag, and anchor.
 *
 * @module modules/library/presentation/components/headingParts
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-02
 */

import React, { type ReactNode } from 'react';

/**
 * Parsed heading payload.
 *
 * @property {ReactNode[]} titleNodes - Title content, trailing tag stripped
 * @property {string | null} cost - Trailing span text, used as tag or cost
 * @property {string | null} anchor - Anchor id from heading element props
 */
export interface ParsedHeading {
  titleNodes: ReactNode[];
  cost: string | null;
  anchor: string | null;
}

/**
 * Returns true when a React node is a heading element.
 *
 * @param {ReactNode} node - Node to evaluate
 * @returns {boolean} True when the node is h1-h6 or mapped heading component
 */
export function isHeadingNode(node: ReactNode): boolean {
  if (!React.isValidElement(node)) {
    return false;
  }

  if (typeof node.type === 'string') {
    return /^h[1-6]$/i.test(node.type);
  }

  if (typeof node.type === 'function') {
    const fn = node.type as { displayName?: string; name?: string };
    const fnName = fn.displayName || fn.name || '';
    return /^H[1-6]$/i.test(fnName);
  }

  if (typeof node.type === 'object' && node.type !== null) {
    const obj = node.type as { displayName?: string };
    return /^H[1-6]$/i.test(obj.displayName || '');
  }

  return false;
}

/**
 * Splits heading children into title nodes, optional trailing span text, and
 * the anchor the heading carries as a prop.
 *
 * @param {ReactNode} headingNode - Heading element node
 * @returns {ParsedHeading} Parsed heading output
 */
export function parseHeading(headingNode: ReactNode): ParsedHeading {
  if (!React.isValidElement(headingNode)) {
    return {
      titleNodes: [],
      cost: null,
      anchor: null,
    };
  }

  const headingChildren = (headingNode.props as { children?: ReactNode }).children;
  const props = headingNode.props as Record<string, unknown>;
  const headingId =
    (props['data-anchor'] as string | undefined) ??
    (props.dataAnchor as string | undefined) ??
    (props.id as string | undefined) ??
    null;

  const nodes = React.Children.toArray(headingChildren).filter((node) => {
    if (typeof node === 'string') {
      return node.trim().length > 0;
    }

    return true;
  });

  const lastNode = nodes[nodes.length - 1];
  const hasCostSpan =
    React.isValidElement<{ children?: React.ReactNode }>(lastNode) &&
    typeof lastNode.type === 'string' &&
    lastNode.type.toLowerCase() === 'span';

  if (!hasCostSpan) {
    return {
      titleNodes: nodes,
      cost: null,
      anchor: headingId,
    };
  }

  const costText = React.Children.toArray(lastNode.props.children)
    .join('')
    .trim();

  return {
    titleNodes: nodes.slice(0, -1),
    cost: costText.length > 0 ? costText : null,
    anchor: headingId,
  };
}

/**
 * Plain text of React nodes, recursing into element children.
 *
 * @param {ReactNode} node - Node to flatten
 * @returns {string} Concatenated text content
 */
export function textOfNodes(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(textOfNodes).join('');
  }
  if (React.isValidElement<{ children?: ReactNode }>(node)) {
    return textOfNodes(node.props.children);
  }
  return '';
}

/**
 * Heading level of a heading node, derived from its tag or display name.
 *
 * @param {ReactNode} node - Heading element
 * @returns {number} Level 1-6, or 0 when the node is not a heading
 */
export function headingLevelOf(node: ReactNode): number {
  if (!isHeadingNode(node) || !React.isValidElement(node)) {
    return 0;
  }
  if (typeof node.type === 'string') {
    const match = node.type.match(/^h([1-6])$/i);
    return match ? Number(match[1]) : 0;
  }
  const fn = node.type as { displayName?: string; name?: string };
  const fnName = fn.displayName || fn.name || '';
  const match = fnName.match(/^H([1-6])$/i);
  return match ? Number(match[1]) : 0;
}
