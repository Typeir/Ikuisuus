/**
 * @fileoverview Heirloom wrapper.
 * @description Holds the whole item, story included. Renders the italic brief
 * from its identity slots first, then the children in source order, and files
 * the stats list from its number slots under the author's Attributes heading,
 * or after the rule closing the primer when there is none. Authors group the
 * blocks under their own `###` headings (Attributes, Traits, Features);
 * sectionize nests the blocks beneath them.
 * Header slots arrive as attributes by default, or as a paragraph of slot
 * elements; slot props derive from the slot schema.
 *
 * @module modules/library/presentation/components/slots/Heirloom
 * @version 0.5.0
 * @author Typeir
 * @since 2026-09-02
 */

'use client';

import {
  HEIRLOOM_SLOT_NAMES,
  STAT_SLOTS,
  STATS_SECTION_ANCHOR,
  type HeirloomSlotName,
  type SlotProps,
} from '@/modules/library/domain/slots';
import { useTranslations } from 'next-intl';
import React, { type ReactNode } from 'react';
import {
  cleanChildren,
  collectSlotEntries,
  SlotRow,
  splitSlotRuns,
} from './slotElements';
import styles from './slots.module.scss';

/**
 * Props for the Heirloom wrapper: one optional prop per header slot, plus the
 * art, primer, `---`, and features as children.
 */
export type HeirloomProps = SlotProps<HeirloomSlotName> & {
  children?: ReactNode;
};

/**
 * Header slot values keyed by slot name.
 */
type HeaderValues = Partial<Record<HeirloomSlotName, ReactNode>>;

/**
 * Enchantment attribute of the form `+N accuracy, +N damage`.
 */
const PAIRED_ENCHANTMENT = /^\+(\d+)\s+accuracy,\s*\+(\d+)\s+damage$/i;

/**
 * Upper-cases the first character.
 *
 * @param {string} text - Text
 * @returns {string} Text with a capital first letter
 */
function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Lower-cases the first character.
 *
 * @param {string} text - Text
 * @returns {string} Text with a lower-case first letter
 */
function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/**
 * Enchantment clause: equal accuracy and damage bonuses collapse into one
 * figure, anything else prints as authored.
 *
 * @param {string} value - Enchantment attribute
 * @returns {string} Clause text
 *
 * @example
 * enchantmentClause('+1 accuracy, +1 damage'); // '+1 accuracy and damage'
 * enchantmentClause('+1 accuracy, +3 damage'); // '+1 accuracy, +3 damage'
 */
function enchantmentClause(value: string): string {
  const paired = value.trim().match(PAIRED_ENCHANTMENT);
  if (paired && paired[1] === paired[2]) {
    return `+${paired[1]} accuracy and damage`;
  }
  return value.trim();
}

/**
 * Whether a node is the `---` element.
 *
 * @param {ReactNode} node - Node to test
 * @returns {boolean} True for an `hr` element
 */
function isRule(node: ReactNode): boolean {
  return (
    React.isValidElement(node) &&
    typeof node.type === 'string' &&
    node.type === 'hr'
  );
}

/**
 * Whether a node is the section the stats belong in: the one sectionize built
 * from the author's Attributes heading.
 *
 * @param {ReactNode} node - Node to test
 * @returns {boolean} True for that section
 */
function isStatsSection(node: ReactNode): boolean {
  return (
    React.isValidElement(node) &&
    node.type === 'section' &&
    (node.props as Record<string, unknown>)['data-anchor'] ===
      STATS_SECTION_ANCHOR
  );
}

/**
 * The section with the stats list appended to its content.
 *
 * @param {React.ReactElement} node - The stats section
 * @param {ReactNode} stats - The stats list
 * @returns {ReactNode} The section, filled
 */
function fillStatsSection(
  node: React.ReactElement,
  stats: ReactNode,
): ReactNode {
  const children = React.Children.toArray(
    (node.props as { children?: ReactNode }).children,
  );
  return React.cloneElement(node, undefined, ...children, stats);
}

/**
 * Renders a header value inside a sentence: strings as text, anything else
 * (a fragment the attribute rewrite built) as given.
 *
 * @param {ReactNode} value - Slot value
 * @returns {ReactNode} Sentence fragment
 */
function inline(value: ReactNode): ReactNode {
  return typeof value === 'string' ? value.trim() : value;
}

/**
 * The brief lines built from the identity slots: rarity and attunement, then
 * the object, then one line per optional extra (focus, Nullifying).
 *
 * @param {HeaderValues} values - Header slot values
 * @param {(key: string) => string} t - Translator for the heirloom namespace
 * @returns {ReactNode[][]} Lines, each a list of fragments; empty lines dropped
 */
function briefLines(
  values: HeaderValues,
  t: (key: string) => string,
): ReactNode[][] {
  const lines: ReactNode[][] = [];

  const first: ReactNode[] = [];
  if (typeof values.rarity === 'string') {
    first.push(`${capitalize(values.rarity.trim())} ${t('kind')}`);
  } else if (values.rarity !== undefined) {
    first.push(values.rarity, ` ${t('kind')}`);
  }
  if (values.attunement !== undefined) {
    const attunement = inline(values.attunement);
    first.push(first.length ? ', ' : '', t('requiresAttunement'));
    if (attunement !== 'required') {
      first.push(' ', attunement);
    }
  }
  if (first.length) lines.push(first);

  const second: ReactNode[] = [];
  const quality =
    typeof values.quality === 'string' ? values.quality.trim() : undefined;
  const hasQuality = !!quality && quality.toLowerCase() !== 'mundane';
  if (hasQuality) second.push(capitalize(quality));
  if (values.base !== undefined) {
    const base = inline(values.base);
    second.push(
      hasQuality ? ' ' : '',
      hasQuality && typeof base === 'string' ? lowerFirst(base) : base,
    );
  }
  if (values.enchantment !== undefined) {
    const enchantment = inline(values.enchantment);
    second.push(
      second.length ? ', ' : '',
      `${t('enchanted')} `,
      typeof enchantment === 'string'
        ? enchantmentClause(enchantment)
        : enchantment,
    );
  }
  if (second.length) lines.push(second);

  if (typeof values.focus === 'string') {
    const [kind, ...rest] = values.focus.split(',');
    const condition = rest.join(',').trim();
    lines.push([
      `${capitalize(kind.trim())} ${t('focus')}`,
      condition ? ` ${condition}` : '',
    ]);
  } else if (values.focus !== undefined) {
    lines.push([values.focus, ` ${t('focus')}`]);
  }

  if (values.nullifying !== undefined) {
    const nullifying = inline(values.nullifying);
    const line: ReactNode[] = [t('nullifying')];
    if (typeof nullifying === 'string' ? nullifying : true) {
      line.push(' ', nullifying);
    }
    lines.push(line);
  }

  return lines;
}

/**
 * Stats list: one labelled entry per number slot the item carries, in schema
 * order, the versatile die riding inside the damage entry. A list, so the
 * entries carry the site's list ornament as a stat block's do.
 *
 * @param {HeaderValues} values - Header slot values
 * @returns {ReactNode} The list, or null without number slots
 */
function statsList(values: HeaderValues): ReactNode {
  const present = STAT_SLOTS.filter((name) => values[name] !== undefined);
  if (present.length === 0) return null;

  return (
    <ul data-heirloom-stats>
      {present.map((name) => (
        <li key={name}>
          <SlotRow name={name}>
            {inline(values[name])}
            {name === 'damage' && values.versatile !== undefined && (
              <> ({inline(values.versatile)})</>
            )}
          </SlotRow>
        </li>
      ))}
    </ul>
  );
}

/**
 * Heirloom wrapper component.
 *
 * @param {HeirloomProps} props - Wrapper props
 * @returns {JSX.Element} The heirloom section
 */
const Heirloom: React.FC<HeirloomProps> = ({ children, ...slots }) => {
  const t = useTranslations('library.heirloom');
  const nodes = cleanChildren(children);
  const { entries, kept } = splitSlotRuns(nodes, HEIRLOOM_SLOT_NAMES);
  const values: HeaderValues = Object.fromEntries(
    collectSlotEntries(HEIRLOOM_SLOT_NAMES, slots, entries).map((entry) => [
      entry.name,
      entry.value,
    ]),
  );

  const lines = briefLines(values, t);

  const stats = <React.Fragment key='stats'>{statsList(values)}</React.Fragment>;
  const sectionIndex = kept.findIndex((node) => isStatsSection(node));

  let body: ReactNode[];
  if (sectionIndex >= 0) {
    body = [...kept];
    body[sectionIndex] = fillStatsSection(
      kept[sectionIndex] as React.ReactElement,
      stats,
    );
  } else {
    const ruleIndex = kept.findIndex((node) => isRule(node));
    body =
      ruleIndex >= 0
        ? [...kept.slice(0, ruleIndex + 1), stats, ...kept.slice(ruleIndex + 1)]
        : [...kept, stats];
  }

  return (
    <section data-heirloom>
      {lines.length > 0 && (
        <p className={styles.brief} data-heirloom-brief>
          {lines.map((line, index) => (
            <React.Fragment key={index}>
              <em>{line}</em>
              {index < lines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      )}
      {body}
    </section>
  );
};

Heirloom.displayName = 'Heirloom';

export default Heirloom;
