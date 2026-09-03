/**
 * @fileoverview Feature block.
 * @description Renders a declared-by-name feature: the first heading child
 * names it, a trailing span in the heading is the tag and prints beside the
 * name, since it says what kind of block this is; the cost prints at the
 * heading's right edge the way boons print BP; the other slots print as
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
  POOL_SLOT_NAMES,
  type FeatureSlotName,
  type PoolSlotName,
  type SlotName,
  type SlotProps,
} from '@/modules/library/domain/slots';
import { useTranslations } from 'next-intl';
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
export type FeatureKind = 'feature' | 'trait' | 'curse' | 'pool';

/**
 * Props for the Feature component: one optional prop per feature slot, the
 * block kind, and the heading, optional slot run, and prose as children.
 */
export type FeatureProps = SlotProps<FeatureSlotName | PoolSlotName> & {
  kind?: FeatureKind;
  mark?: FeatureMark;
  children?: ReactNode;
};

/**
 * What a block costs to use, as the heading's glyph reports it.
 */
export type FeatureMark = 'major' | 'minor' | 'other';

/**
 * Slot names each kind accepts. A pool holds a number rather than doing
 * something, so it carries its own slots instead of the action ones.
 */
const SLOT_NAMES_BY_KIND: Record<FeatureKind, readonly SlotName[]> = {
  feature: FEATURE_SLOT_NAMES,
  trait: FEATURE_SLOT_NAMES,
  curse: FEATURE_SLOT_NAMES,
  pool: POOL_SLOT_NAMES,
};

/**
 * Deed types whose timing the card writes.
 */
const DEED_TYPES = ['stratagem', 'act', 'resist', 'lair', 'phase'] as const;

/**
 * Marks read off a cost. The cost names an action or it does not, so the
 * pattern asks for the action and not the bare word: a cost that merely
 * mentions a major threat costs no Major Action.
 */
const COST_MARKS: ReadonlyArray<readonly [RegExp, FeatureMark]> = [
  [/\bmajor\s+action\b/i, 'major'],
  [/\bminor\s+action\b/i, 'minor'],
];

/**
 * The block's mark: the author's when given, otherwise the action its cost
 * names, and `other` for a block that costs no action.
 *
 * @param {FeatureMark} [explicit] - Mark the author set
 * @param {ReactNode} cost - The block's cost
 * @returns {FeatureMark} Mark to stamp
 */
function markOf(explicit: FeatureMark | undefined, cost: ReactNode): FeatureMark {
  if (explicit) return explicit;
  if (typeof cost !== 'string') return 'other';
  return COST_MARKS.find(([pattern]) => pattern.test(cost))?.[1] ?? 'other';
}

/**
 * Host heading tags by level. The title nodes arrive already rendered by the
 * registry's heading component (first letter wrapped, anchor stamped), so the
 * block re-emits them under a plain tag rather than through that component
 * again, which would wrap twice and diverge between the server and client
 * passes.
 */
const HEADING_TAGS = [null, 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

/**
 * A slot value as the card prints it. `mastery` and `deed` declare a rule the
 * component writes out, so the authored value selects the sentence rather
 * than being the sentence; every other slot prints what was written.
 *
 * @param {SlotName} name - Slot name
 * @param {ReactNode} value - Authored value
 * @param {(key: string, values?: Record<string, string>) => string} t -
 * Translator over the `library` namespace
 * @returns {ReactNode} Value to print
 */
function constructed(
  name: SlotName,
  value: ReactNode,
  t: (key: string, values?: Record<string, string>) => string,
): ReactNode {
  const text = typeof value === 'string' ? value.trim() : '';

  if (name === 'mastery') {
    return text
      ? t('feature.masteryWith', { kind: text })
      : t('feature.masteryAny');
  }

  if (name === 'deed') {
    const type = text.toLowerCase();
    return (DEED_TYPES as readonly string[]).includes(type)
      ? t('feature.deed.' + type)
      : value;
  }

  return value;
}

/**
 * Feature block component.
 *
 * @param {FeatureProps} props - Block props
 * @returns {JSX.Element} The feature article
 */
const Feature: React.FC<FeatureProps> = ({
  kind = 'feature',
  mark,
  children,
  ...slots
}) => {
  const t = useTranslations('library');
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

  const slotNames = SLOT_NAMES_BY_KIND[kind];
  const { entries: childSlots, kept: body } = splitSlotRuns(
    bodyNodes,
    slotNames,
  );
  const entries = collectSlotEntries(slotNames, slots, childSlots).map(
    (entry) => ({ ...entry, value: constructed(entry.name, entry.value, t) }),
  );
  const cost = entries.find((entry) => entry.name === 'cost')?.value;
  const rows = entries.filter((entry) => entry.name !== 'cost');

  const level = headingNode ? headingLevelOf(headingNode) : 0;
  const Tag = HEADING_TAGS[level];

  const headingElement = Tag ? (
    <Tag data-anchor={anchor ?? undefined} className={styles.heading}>
      <span className={styles.headingTitle} data-heading-title>
        {parsed.titleNodes}
      </span>
      {parsed.cost && (
        <span className={styles.tag} data-feature-tag>
          {parsed.cost}
        </span>
      )}
      {cost !== undefined && (
        <span className={styles.headingMeta}>
          <span className={styles.cost} data-feature-cost>
            {cost}
          </span>
        </span>
      )}
    </Tag>
  ) : null;

  return (
    <article
      data-kind={kind}
      data-mark={markOf(mark, cost)}
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

/**
 * Pool block: a number the host owns and its blocks spend from. Nothing about
 * it is heirloom-specific, so any host that accepts pools renders the same
 * block.
 *
 * @param {Omit<FeatureProps, 'kind'>} props - Block props
 * @returns {JSX.Element} The pool article
 */
export const Pool: React.FC<Omit<FeatureProps, 'kind'>> = (props) => (
  <Feature kind='pool' {...props} />
);

Pool.displayName = 'Pool';

export default Feature;
