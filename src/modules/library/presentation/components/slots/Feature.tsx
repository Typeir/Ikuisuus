/**
 * @fileoverview Feature block.
 * @description Renders a declared-by-name feature: the first heading child
 * names it, a trailing span in the heading is the tag, the cost prints at the
 * heading's right edge the way boons print BP, Targets and Recharge print as
 * labelled slot lines, and the rest is prose. Slots arrive as attributes by
 * default or as a paragraph of slot elements; slot props derive from the slot
 * schema. The block is a plain article: its heading keeps the authored level,
 * and the section ornament belongs to the `###` group sections authors write
 * around the blocks, which sectionize builds. Trait and Curse are kind
 * wrappers.
 *
 * @module modules/library/presentation/components/slots/Feature
 * @version 0.5.0
 * @author Typeir
 * @since 2026-09-02
 */

'use client';

import { anchorSlug } from '@/modules/library/domain/anchorSlug';
import {
  FEATURE_SLOT_NAMES,
  type FeatureSlotName,
  type SlotProps,
} from '@/modules/library/domain/slots';
import React, { type ReactNode } from 'react';
import {
  headingLevelOf,
  isHeadingNode,
  parseHeading,
  textOfNodes,
} from '../headingParts';
import {
  cleanChildren,
  collectSlotEntries,
  slotElementOf,
  splitSlotRuns,
} from './slotElements';
import styles from './slots.module.scss';

/**
 * Feature kind values.
 */
export type FeatureKind = 'feature' | 'trait' | 'curse';

/**
 * Props for the Feature component: one optional prop per feature slot, the
 * block kind, and the heading, optional slot run, and prose as children.
 */
export type FeatureProps = SlotProps<FeatureSlotName> & {
  kind?: FeatureKind;
  children?: ReactNode;
};

/**
 * Host heading tags by level. The title nodes arrive already rendered by the
 * registry's heading component (first letter wrapped, anchor stamped), so the
 * block re-emits them under a plain tag rather than through that component
 * again, which would wrap twice and diverge between the server and client
 * passes.
 */
const HEADING_TAGS = [null, 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

/**
 * Feature block component.
 *
 * @param {FeatureProps} props - Block props
 * @returns {JSX.Element} The feature article
 */
const Feature: React.FC<FeatureProps> = ({
  kind = 'feature',
  children,
  ...slots
}) => {
  const nodes = cleanChildren(children);
  const headingIndex = nodes.findIndex((node) => isHeadingNode(node));
  const headingNode = headingIndex >= 0 ? nodes[headingIndex] : null;
  const parsed =
    headingNode && React.isValidElement(headingNode)
      ? parseHeading(headingNode)
      : { titleNodes: [] as ReactNode[], cost: null, anchor: null };

  const titleText = textOfNodes(parsed.titleNodes).trim();
  const anchor =
    parsed.anchor ?? (titleText ? anchorSlug(titleText) : null);

  const bodyNodes =
    headingIndex >= 0
      ? nodes.filter((_, index) => index !== headingIndex)
      : nodes;

  const { entries: childSlots, kept: body } = splitSlotRuns(
    bodyNodes,
    FEATURE_SLOT_NAMES,
  );
  const entries = collectSlotEntries(FEATURE_SLOT_NAMES, slots, childSlots);
  const cost = entries.find((entry) => entry.name === 'cost')?.value;
  const rows = entries.filter((entry) => entry.name !== 'cost');

  const level = headingNode ? headingLevelOf(headingNode) : 0;
  const Tag = HEADING_TAGS[level];
  const hasMeta = parsed.cost !== null || cost !== undefined;

  const headingElement = Tag ? (
    <Tag data-anchor={anchor ?? undefined} className={styles.heading}>
      <span className={styles.headingTitle} data-heading-title>
        {parsed.titleNodes}
      </span>
      {hasMeta && (
        <span className={styles.headingMeta}>
          {parsed.cost && (
            <span className={styles.tag} data-feature-tag>
              {parsed.cost}
            </span>
          )}
          {cost !== undefined && (
            <span className={styles.cost} data-feature-cost>
              {cost}
            </span>
          )}
        </span>
      )}
    </Tag>
  ) : null;

  return (
    <article
      data-kind={kind}
      {...(anchor ? { 'data-anchor': anchor } : {})}>
      {headingElement}
      {rows.length > 0 && (
        <p data-slot-grid>
          {rows.map((entry) => {
            const Slot = slotElementOf(entry.name);
            return <Slot key={entry.name}>{entry.value}</Slot>;
          })}
        </p>
      )}
      <div data-feature-body>{body}</div>
    </article>
  );
};

Feature.displayName = 'Feature';

/**
 * Trait kind wrapper around Feature.
 *
 * @param {Omit<FeatureProps, 'kind'>} props - Block props
 * @returns {JSX.Element} The trait article
 */
export const Trait: React.FC<Omit<FeatureProps, 'kind'>> = (props) => (
  <Feature kind='trait' {...props} />
);

Trait.displayName = 'Trait';

/**
 * Curse kind wrapper around Feature.
 *
 * @param {Omit<FeatureProps, 'kind'>} props - Block props
 * @returns {JSX.Element} The curse article
 */
export const Curse: React.FC<Omit<FeatureProps, 'kind'>> = (props) => (
  <Feature kind='curse' {...props} />
);

Curse.displayName = 'Curse';

export default Feature;
