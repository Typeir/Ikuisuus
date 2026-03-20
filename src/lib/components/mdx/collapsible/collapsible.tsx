/**
 * @fileoverview Collapsible MDX Component
 * @description A collapsible details/summary block for use in MDX content.
 * Built on native HTML details/summary for accessibility and zero-JS operation.
 *
 * @module Collapsible
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { ChevronRight } from 'lucide-react';
import React, { ReactNode } from 'react';
import styles from './collapsible.module.scss';

/**
 * Props for the Collapsible component.
 *
 * @property {boolean} [open] - Whether the block starts expanded
 * @property {ReactNode} [children] - The collapsible content
 */
export interface CollapsibleProps {
  open?: boolean;
  children?: ReactNode;
}

/**
 * Parsed heading payload for Collapsible summary rendering.
 *
 * @property {ReactNode[]} titleNodes - Summary title content nodes
 * @property {string | null} cost - Optional summary cost extracted from a span child
 */
interface ParsedHeading {
  titleNodes: ReactNode[];
  cost: string | null;
}

/**
 * Returns true when a React node is a heading element.
 *
 * @param {ReactNode} node - Node to evaluate
 * @returns {boolean} True when the node is h1-h6 or mapped heading component
 */
function isHeadingNode(node: ReactNode): boolean {
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

  return false;
}

/**
 * Splits heading children into title nodes and optional cost text.
 *
 * @param {ReactNode} headingChildren - Heading children content
 * @returns {ParsedHeading} Parsed heading output
 */
function parseHeading(headingChildren: ReactNode): ParsedHeading {
  const nodes = React.Children.toArray(headingChildren).filter((node) => {
    if (typeof node === 'string') {
      return node.trim().length > 0;
    }

    return true;
  });

  const lastNode = nodes[nodes.length - 1];
  const hasCostSpan =
    React.isValidElement(lastNode) &&
    typeof lastNode.type === 'string' &&
    lastNode.type.toLowerCase() === 'span';

  if (!hasCostSpan) {
    return {
      titleNodes: nodes,
      cost: null,
    };
  }

  const costText = React.Children.toArray(lastNode.props.children)
    .join('')
    .trim();

  return {
    titleNodes: nodes.slice(0, -1),
    cost: costText.length > 0 ? costText : null,
  };
}

/**
 * @component Collapsible
 * @description Renders a collapsible content block using native details/summary.
 * Summary content is derived from the first heading child found inside the component.
 *
 * @param {CollapsibleProps} props
 * @param {boolean} [props.open] - Start expanded
 * @param {ReactNode} [props.children] - Collapsible heading and body content
 * @returns {JSX.Element} A styled details/summary element
 *
 * @example
 * <Collapsible>
 *   ## Extended Reach <span>6 BP</span>
 *   Your melee weapon attacks have a reach of 5 feet greater than normal.
 * </Collapsible>
 */
const Collapsible: React.FC<CollapsibleProps> = ({
  open = false,
  children,
}) => {
  const nodes = React.Children.toArray(children);
  const headingIndex = nodes.findIndex((node) => isHeadingNode(node));
  const headingNode = headingIndex >= 0 ? nodes[headingIndex] : null;

  const parsedHeading =
    headingNode && React.isValidElement(headingNode)
      ? parseHeading((headingNode.props as { children?: ReactNode }).children)
      : {
          titleNodes: ['Details'],
          cost: null,
        };

  const bodyNodes =
    headingIndex >= 0
      ? nodes.filter((_, index) => index !== headingIndex)
      : nodes;

  return (
    <details className={styles.collapsible} open={open || undefined}>
      <summary className={styles.summary}>
        <span>
          {parsedHeading.titleNodes}
          {parsedHeading.cost && (
            <span className={styles.cost}>{parsedHeading.cost}</span>
          )}
        </span>
        <ChevronRight className={styles.chevron} size={14} aria-hidden='true' />
      </summary>
      <div className={styles.content}>{bodyNodes}</div>
    </details>
  );
};

export default Collapsible;
