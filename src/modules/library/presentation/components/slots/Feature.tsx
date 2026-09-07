/**
 * @fileoverview Feature block.
 * @description Renders a declared-by-name feature: the first heading child
 * names it, a trailing span in the heading is the tag and prints beside the
 * name, since it says what kind of block this is; the cost prints at the
 * heading's right edge the way boons print BP; the other slots print as
 * labelled slot lines, and the rest is prose.
 *
 * @module modules/library/presentation/components/slots/Feature
 * @version 0.5.0
 * @author Typeir
 * @since 2026-09-02
 */

'use client';

import { anchorSlug } from '@/modules/library/domain/anchorSlug';
import {
  ATTACK_SLOT_NAMES,
  FEATURE_SLOT_NAMES,
  POOL_SLOT_NAMES,
  type AttackSlotName,
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
import Collapsible from '../Collapsible/Collapsible';
import { cleanChildren, readSlots, slotElementOf } from './slotElements';
import styles from './slots.module.scss';

/**
 * Feature kind values.
 */
export type FeatureKind =
  | 'feature'
  | 'trait'
  | 'curse'
  | 'action'
  | 'pool'
  | 'attack';

/**
 * Props for the Feature component: one optional prop per feature slot, the
 * block kind, and the heading, optional slot run, and prose as children.
 */
export type FeatureProps = SlotProps<
  FeatureSlotName | PoolSlotName | AttackSlotName
> & {
  kind?: FeatureKind;
  mark?: FeatureMark;
  collapsible?: boolean;
  open?: boolean;
  children?: ReactNode;
};

/**
 * What a block costs to use, as the heading's glyph reports it.
 */
export type FeatureMark = 'major' | 'minor' | 'deed' | 'other';

/**
 * Slot names each kind accepts.
 */
const SLOT_NAMES_BY_KIND: Record<FeatureKind, readonly SlotName[]> = {
  feature: FEATURE_SLOT_NAMES,
  trait: FEATURE_SLOT_NAMES,
  curse: FEATURE_SLOT_NAMES,
  action: FEATURE_SLOT_NAMES,
  pool: POOL_SLOT_NAMES,
  attack: ATTACK_SLOT_NAMES,
};

/**
 * Deed types whose timing the card writes.
 */
const DEED_TYPES = ['stratagem', 'act', 'resist', 'lair', 'phase'] as const;

/**
 * Marks read off a cost.
 */
const COST_MARKS: ReadonlyArray<readonly [RegExp, FeatureMark]> = [
  [/\bmajor\s+action\b/i, 'major'],
  [/\bminor\s+action\b/i, 'minor'],
  [/\bdeeds?\b/i, 'deed'],
];

/**
 * The block's mark: the author's when given, otherwise the action its cost
 * names, and `other` for a block that costs no action.
 *
 * @param {FeatureMark} [explicit] - Mark the author set
 * @param {ReactNode} cost - The block's cost
 * @returns {FeatureMark} Mark to stamp
 */
function markOf(
  explicit: FeatureMark | undefined,
  cost: ReactNode,
): FeatureMark {
  if (explicit) return explicit;
  if (typeof cost !== 'string') return 'other';
  return COST_MARKS.find(([pattern]) => pattern.test(cost))?.[1] ?? 'other';
}

/**
 * Host heading tags by level.
 */
const HEADING_TAGS = [null, 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

/**
 * A slot value as the card prints it.
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

  if (name === 'level') {
    return text ? t('feature.level', { level: text }) : value;
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
 * @description Given `collapsible`, the block's own heading becomes the
 * summary of a details element and the slot grid folds away with the prose,
 * rather than sitting above a closed block. `open` starts it expanded. The
 * two go together often enough that a boon writes `<Feature collapsible>`
 * instead of a `<Collapsible>` wrapped around a feature.
 *
 * @param {FeatureProps} props - Block props
 * @returns {JSX.Element} The feature article
 */
const Feature: React.FC<FeatureProps> = ({
  kind = 'feature',
  mark,
  collapsible = false,
  open = false,
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
  const anchor = parsed.anchor ?? (titleText ? anchorSlug(titleText) : null);

  const bodyNodes =
    headingIndex >= 0
      ? nodes.filter((_, index) => index !== headingIndex)
      : nodes;

  const slotNames = SLOT_NAMES_BY_KIND[kind];
  const { values, kept: body } = readSlots(bodyNodes, slotNames, slots);
  const entries = slotNames
    .filter((name) => values[name] !== undefined)
    .map((name) => ({ name, value: constructed(name, values[name], t) }));
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

  const grid = rows.length > 0 && (
    <p data-slot-grid>
      {rows.map((entry) => {
        const Slot = slotElementOf(entry.name);
        return <Slot key={entry.name}>{entry.value}</Slot>;
      })}
    </p>
  );
  const bodyElement = <div data-feature-body>{body}</div>;

  const summary = (
    <>
      <span data-heading-title>{parsed.titleNodes}</span>
      {parsed.cost && <span data-feature-tag>{parsed.cost}</span>}
      {cost !== undefined && <span data-feature-cost>{cost}</span>}
    </>
  );

  return (
    <article
      data-kind={kind}
      data-mark={markOf(mark, cost)}
      {...(collapsible ? { 'data-collapsible': 'true' } : {})}
      {...(anchor ? { 'data-anchor': anchor } : {})}>
      {collapsible ? (
        <Collapsible summary={summary} anchor={anchor ?? undefined} open={open}>
          {grid}
          {bodyElement}
        </Collapsible>
      ) : (
        <>
          {headingElement}
          {grid}
          {bodyElement}
        </>
      )}
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
 * Action block: what a creature does on its turn.
 *
 * @param {Omit<FeatureProps, 'kind'>} props - Block props
 * @returns {JSX.Element} The action article
 */
export const Action: React.FC<Omit<FeatureProps, 'kind'>> = (props) => (
  <Feature kind='action' {...props} />
);

Action.displayName = 'Action';

/**
 * Pool block: a number the host owns and its blocks spend from.
 *
 * @param {Omit<FeatureProps, 'kind'>} props - Block props
 * @returns {JSX.Element} The pool article
 */
export const Pool: React.FC<Omit<FeatureProps, 'kind'>> = (props) => (
  <Feature kind='pool' {...props} />
);

Pool.displayName = 'Pool';

/**
 * Attack block inside an action: accuracy, reach or range, targets, then the hit as prose.
 * A heading names it when the action holds several.
 *
 * @param {Omit<FeatureProps, 'kind'>} props - Block props
 * @returns {JSX.Element} The attack article
 */
export const Attack: React.FC<Omit<FeatureProps, 'kind'>> = (props) => (
  <Feature kind='attack' {...props} />
);

Attack.displayName = 'Attack';

export default Feature;
