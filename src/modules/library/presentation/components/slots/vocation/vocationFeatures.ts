/**
 * @fileoverview The feature headings a vocation card wraps, handed down to
 * whatever inside the card prints them.
 * @module modules/library/presentation/components/slots/vocation/vocationFeatures
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-06
 */

import type { FeatureHeading } from '@/modules/library/domain/progression';
import React, { createContext, useContext, type ReactNode } from 'react';
import { isHeadingNode, parseHeading, textOfNodes } from '../../headingParts';
import { elementNameOf } from '../utils/elementName';
import { slotNameOf } from '../utils/slotElements';

/**
 * Feature headings of the enclosing vocation card.
 */
export const VocationFeaturesContext = createContext<readonly FeatureHeading[]>([]);

/**
 * Feature headings of the enclosing vocation card.
 *
 * @returns {readonly FeatureHeading[]} Headings, empty outside a card
 */
export function useVocationFeatures(): readonly FeatureHeading[] {
  return useContext(VocationFeaturesContext);
}

/**
 * Whether a node is a Feature block.
 *
 * @param {ReactNode} node - Node
 * @returns {boolean} True for a Feature element
 */
function isFeatureNode(node: ReactNode): node is React.ReactElement<{ level?: unknown; children?: ReactNode }> {
  return React.isValidElement(node) && elementNameOf(node) === 'Feature';
}

/**
 * Text of a slot value
 *
 * @param {unknown} value - Slot value
 * @returns {string} Text
 */
function textOf(value: unknown): string {
  return typeof value === 'string' ? value : textOfNodes(value as ReactNode);
}

/**
 * The level a Feature declares, as attribute or as its Level slot element.
 *
 * @param {React.ReactElement<{ level?: unknown; children?: ReactNode }>} feature - Feature element
 * @returns {number | null} Level, or null when it declares none
 */
function levelOf(feature: React.ReactElement<{ level?: unknown; children?: ReactNode }>): number | null {
  let text = feature.props.level === undefined ? '' : textOf(feature.props.level);
  if (text === '') {
    const kids = React.Children.toArray(feature.props.children);
    for (const kid of kids) {
      const paragraph = React.isValidElement(kid) && kid.type === 'p'
        ? React.Children.toArray((kid.props as { children?: ReactNode }).children)
        : [kid];
      const level = paragraph.find((node) => slotNameOf(node) === 'level');
      if (level && React.isValidElement(level)) {
        text = textOfNodes((level.props as { children?: ReactNode }).children);
        break;
      }
    }
  }
  const value = Number(text.trim());
  return Number.isInteger(value) && value > 0 ? value : null;
}

/**
 * The heading text of a Feature block.
 *
 * @param {React.ReactElement<{ children?: ReactNode }>} feature - Feature element
 * @returns {string} Heading text, empty without a heading
 */
function nameOf(feature: React.ReactElement<{ children?: ReactNode }>): string {
  const heading = React.Children.toArray(feature.props.children).find((node) => isHeadingNode(node));
  return heading ? textOfNodes(parseHeading(heading).titleNodes).trim() : '';
}

/**
 * Every Feature block among the nodes, at any depth, in page order.
 *
 * @param {ReactNode} nodes - Nodes to search
 * @returns {FeatureHeading[]} Level and heading of each feature that declares both
 */
export function collectFeatureHeadings(nodes: ReactNode): FeatureHeading[] {
  const out: FeatureHeading[] = [];
  const walk = (node: ReactNode): void => {
    if (isFeatureNode(node)) {
      const level = levelOf(node);
      const name = nameOf(node);
      if (level !== null && name !== '') out.push({ level, name });
      return;
    }
    if (React.isValidElement(node)) {
      const children = (node.props as { children?: ReactNode }).children;
      if (children !== undefined) React.Children.forEach(children, walk);
      return;
    }
    if (Array.isArray(node)) node.forEach(walk);
  };
  React.Children.forEach(nodes, walk);
  return out;
}
