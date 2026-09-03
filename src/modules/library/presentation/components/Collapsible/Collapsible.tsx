/**
 * @fileoverview Collapsible MDX Component
 * @description Collapsible details/summary block for MDX content. Uses native HTML details/summary.
 *
 * @module modules/library/presentation/components/Collapsible/Collapsible
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { ChevronRight } from 'lucide-react';
import React, { ReactNode } from 'react';
import { isHeadingNode, parseHeading } from '../headingParts';
import styles from './Collapsible.module.scss';

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
 * @component Collapsible
 * @description Renders a collapsible content block using native details/summary.
 * Summary content is derived from the first heading child inside the component.
 *
 * @param {CollapsibleProps} props
 * @param {boolean} [props.open] - Start expanded
 * @param {ReactNode} [props.children] - Collapsible heading and body content
 * @returns {JSX.Element} A details/summary element
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
      ? parseHeading(headingNode)
      : {
          titleNodes: ['Details'],
          cost: null,
          anchor: null,
        };

  const bodyNodes =
    headingIndex >= 0
      ? nodes.filter((_, index) => index !== headingIndex)
      : nodes;

  return (
    <details className={styles.collapsible} open={open || undefined}>
      <summary
        className={styles.summary}
        {...(parsedHeading.anchor && { 'data-anchor': parsedHeading.anchor })}
      >
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
