/**
 * @fileoverview Feature block.
 * @description Renders a declared-by-name feature
 *
 * @module modules/library/presentation/components/slots/feature/Feature
 * @version 0.6.0
 * @author Typeir
 * @since 2026-09-02
 */

'use client';

import { anchorSlug } from '@/modules/library/domain/anchorSlug';
import {
  markCount,
  markOf,
  type CostMark,
} from '@/modules/library/domain/costMark';
import { saveDcFrom } from '@/modules/library/domain/derive';
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
} from '../../headingParts';
import { Aspects } from '../../Aspects/Aspects';
import Collapsible from '../../Collapsible/Collapsible';
import { holdsCards, useCardFold } from '../utils/cardFold';
import { CostMarkProvider, useCostMark } from './costMarkContext';
import { disclosure } from '../utils/fold/foldDivision';
import { cleanChildren, readSlots, slotElementOf } from '../utils/slotElements';
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
 * Props for the Feature component
 */
export type FeatureProps = SlotProps<
  FeatureSlotName | PoolSlotName | AttackSlotName
> & {
  kind?: FeatureKind;
  mark?: FeatureMark;
  collapsible?: boolean;
  open?: boolean;
  skin?: 'panel' | 'light';
  ornament?: boolean;
  children?: ReactNode;
};

/**
 * What a block costs to use, as the heading's glyph reports it.
 */
export type FeatureMark = CostMark;

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
 * summary of a details element and the slot grid folds away with the prose
 *
 * @param {FeatureProps} props - Block props
 * @returns {JSX.Element} The feature article
 */
const Feature: React.FC<FeatureProps> = ({
  kind = 'feature',
  mark,
  collapsible = false,
  open = false,
  skin,
  ornament,
  children,
  ...slots
}) => {
  const t = useTranslations('library');
  const inherited = useCostMark();
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
  const { values, kept: body } = readSlots(bodyNodes, slotNames, slots, true);

  /* A block that states an accuracy also states the save it sets, since the two
     are the same number: printing the sum on every such block is what teaches
     the rule. A block that writes its own save keeps it. */
  const printed = { ...values };
  if (printed.saveDc === undefined && typeof printed.accuracy === 'string') {
    const derived = saveDcFrom(printed.accuracy);
    if (derived) {
      printed.saveDc =
        derived.total === null ? (
          derived.working
        ) : (
          <>
            <strong>{derived.total}</strong> [{derived.working}]
          </>
        );
    }
  }

  const entries = slotNames
    .filter((name) => printed[name] !== undefined)
    .map((name) => ({ name, value: constructed(name, printed[name], t) }));
  /* What a block costs and how it comes back are one statement, read beside
     the name: "Giant Hammer — 1 Major Action (Recharge 5–6)". Neither takes a
     row of its own in the grid. */
  const spend = entries.find((entry) => entry.name === 'cost')?.value;
  const recharge = entries.find((entry) => entry.name === 'recharge')?.value;
  const cost =
    recharge === undefined ? (
      spend
    ) : (
      <>
        {spend !== undefined && <>{spend} </>}({t('slots.recharge')} {recharge})
      </>
    );
  const rows = entries.filter(
    (entry) => entry.name !== 'cost' && entry.name !== 'recharge',
  );

  const level = headingNode ? headingLevelOf(headingNode) : 0;
  const Tag = HEADING_TAGS[level];

  const headingElement = Tag ? (
    <Tag data-anchor={anchor ?? undefined} className={styles.heading}>
      <span className={styles.headingTitle} data-heading-title>
        {parsed.titleNodes}
      </span>
      {cost !== undefined && (
        <span className={styles.cost} data-feature-cost>
          {cost}
        </span>
      )}
      {/* The far edge of the heading: what the block is made of, read at a
          glance the way a card reads its colours, and then what it is. */}
      <span className={styles.headingMeta}>
        {anchor && <Aspects section={anchor} size='xs' inline />}
        {parsed.cost && (
          <span className={styles.tag} data-feature-tag>
            {parsed.cost}
          </span>
        )}
      </span>
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
  /* A deed names its own currency, and a block that states no cost takes the
     mark of the block around it. */
  const resolvedMark =
    mark ??
    (spend !== undefined
      ? markOf(undefined, spend)
      : values.deed !== undefined
        ? 'deed'
        : inherited);
  const bodyElement = (
    <div data-feature-body>
      <CostMarkProvider mark={resolvedMark}>{body}</CostMarkProvider>
    </div>
  );

  const summary = (
    <>
      <span data-heading-title>{parsed.titleNodes}</span>
      {parsed.cost && <span data-feature-tag>{parsed.cost}</span>}
      {cost !== undefined && <span data-feature-cost>{cost}</span>}
    </>
  );

  /* A card holding cards of its own opens on its heading when the sheet around
     it is read that way; one holding none is already a heading and a few
     lines, and would collapse to nothing but a repeat of its own title. */
  const folds = useCardFold() && !collapsible && holdsCards(body);

  return (
    <article
      className={styles.block}
      data-kind={kind}
      data-mark={resolvedMark}
      data-mark-count={markCount(spend)}
      {...(collapsible ? { 'data-collapsible': 'true' } : {})}
      {...((ornament ?? !collapsible) ? {} : { 'data-ornament': 'none' })}
      {...(anchor ? { 'data-anchor': anchor } : {})}
      {...(folds ? { 'data-folded': 'true' } : {})}>
      {folds ? (
        disclosure(
          headingElement,
          <>
            {grid}
            {bodyElement}
          </>,
          false,
        )
      ) : collapsible ? (
        <Collapsible
          summary={summary}
          anchor={anchor ?? undefined}
          open={open}
          skin={skin}>
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
 * Action block
 *
 * @param {Omit<FeatureProps, 'kind'>} props - Block props
 * @returns {JSX.Element} The action article
 */
export const Action: React.FC<Omit<FeatureProps, 'kind'>> = (props) => (
  <Feature kind='action' {...props} />
);

Action.displayName = 'Action';

/**
 * Pool block
 *
 * @param {Omit<FeatureProps, 'kind'>} props - Block props
 * @returns {JSX.Element} The pool article
 */
export const Pool: React.FC<Omit<FeatureProps, 'kind'>> = (props) => (
  <Feature kind='pool' {...props} />
);

Pool.displayName = 'Pool';

/**
 * Attack block inside an action
 *
 * @param {Omit<FeatureProps, 'kind'>} props - Block props
 * @returns {JSX.Element} The attack article
 */
export const Attack: React.FC<Omit<FeatureProps, 'kind'>> = (props) => (
  <Feature kind='attack' {...props} />
);

Attack.displayName = 'Attack';

export default Feature;
