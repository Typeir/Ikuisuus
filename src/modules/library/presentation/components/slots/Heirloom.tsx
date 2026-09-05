/**
 * @fileoverview Item card: heirlooms and trinkets.
 * @description Holds the whole item, story included. Renders the italic brief
 * from its identity slots first, then the children in source order, and hands
 * the number slots down for `<Attributes />` to print wherever the author
 * placed it. Authors group the blocks under their own `###` headings
 * (Attributes, Traits, Features); sectionize nests the blocks beneath them.
 * Header slots arrive as attributes by default, or as a paragraph of slot
 * elements; slot props derive from the slot schema.
 *
 * A trinket is the same card with a shorter brief and no `<Attributes />`
 * marker: it leads with its category rather than its rarity, and prints its
 * numbers itself, because a trinket is one block where an heirloom is a page.
 * Both draw from one slot table, so a slot cannot mean two things depending on
 * which tag wrote it.
 *
 * @module modules/library/presentation/components/slots/Heirloom
 * @version 0.5.0
 * @author Typeir
 * @since 2026-09-02
 */

'use client';

import {
  HEIRLOOM_SLOT_NAMES,
  ITEM_ROW_SLOTS,
  STAT_SLOTS,
  type HeirloomSlotName,
  type SlotProps,
} from '@/modules/library/domain/slots';
import { useTranslations } from 'next-intl';
import React, { type ReactNode } from 'react';
import { HeirloomValuesContext, type HeirloomValues } from './Attributes';
import {
  cleanChildren,
  collectSlotEntries,
  inlineValue,
  SlotRow,
  splitSlotRuns,
} from './slotElements';
import { capitalize, flagOf, lowerFirst } from './text';
import styles from './slots.module.scss';

/**
 * Props for the Heirloom wrapper: one optional prop per header slot, plus the
 * art, primer, `---`, and features as children.
 */
export type HeirloomProps = SlotProps<HeirloomSlotName> & {
  kind?: ItemKind;
  children?: ReactNode;
};

/**
 * Which item card to render.
 */
export type ItemKind = 'heirloom' | 'trinket';

/**
 * Rows an item of this kind prints for itself.
 *
 * A trinket prints every row slot, because it is one block with no room for
 * an `<Attributes />` marker. An heirloom prints only what the marker does not
 * already show: `STAT_SLOTS` covers its numbers and `versatile` rides inside
 * the damage cell there.
 *
 * @param {ItemKind} kind - Which item card
 * @returns {readonly HeirloomSlotName[]} Slot names to print
 */
function rowsFor(kind: ItemKind): readonly HeirloomSlotName[] {
  return kind === 'trinket'
    ? ITEM_ROW_SLOTS
    : ITEM_ROW_SLOTS.filter(
        (name) => !STAT_SLOTS.includes(name) && name !== 'versatile',
      );
}

/**
 * The phrase the card already prints before an attunement value, so a value
 * that repeats it is read as the bare flag.
 */
const REQUIRES_ATTUNEMENT = /^(?:requires?\s+attunement|required)\b[\s,:]*/i;

/**
 * What an attunement slot adds after "requires attunement": nothing for the
 * bare flag or a value that only restates it, otherwise the condition.
 *
 * @param {ReactNode} value - Attunement slot value
 * @returns {ReactNode | null} Condition to print, or null
 *
 * @example
 * attunementDetail('required'); // null
 * attunementDetail('requires attunement by a spellcaster'); // 'by a spellcaster'
 */
function attunementDetail(value: ReactNode): ReactNode | null {
  const flag = flagOf(value);
  if (flag === false || flag === true) return null;
  if (typeof flag !== 'string') return flag as ReactNode;
  const detail = flag.replace(REQUIRES_ATTUNEMENT, '').trim();
  return detail === '' ? null : detail;
}

/**
 * Enchantment attribute of the form `+N accuracy, +N damage`.
 */
const PAIRED_ENCHANTMENT = /^\+(\d+)\s+accuracy,\s*\+(\d+)\s+damage$/i;

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
 * The brief lines built from the identity slots: rarity and attunement, then
 * the object, then one line per optional extra (focus, Nullifying).
 *
 * @param {HeaderValues} values - Header slot values
 * @param {(key: string) => string} t - Translator for the heirloom namespace
 * @returns {ReactNode[][]} Lines, each a list of fragments; empty lines dropped
 */
function briefLines(
  values: HeirloomValues,
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
    const attunement = attunementDetail(inlineValue(values.attunement));
    first.push(first.length ? ', ' : '', t('requiresAttunement'));
    if (attunement !== null) first.push(' ', attunement);
  }
  if (first.length) lines.push(first);

  const second: ReactNode[] = [];
  const quality =
    typeof values.quality === 'string' ? values.quality.trim() : undefined;
  const hasQuality = !!quality && quality.toLowerCase() !== 'mundane';
  if (hasQuality) second.push(capitalize(quality));
  if (values.base !== undefined) {
    const base = inlineValue(values.base);
    second.push(
      hasQuality ? ' ' : '',
      hasQuality && typeof base === 'string' ? lowerFirst(base) : base,
    );
  }
  if (values.enchantment !== undefined) {
    const enchantment = inlineValue(values.enchantment);
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
    const nullifying = inlineValue(values.nullifying);
    const line: ReactNode[] = [t('nullifying')];
    if (typeof nullifying === 'string' ? nullifying : true) {
      line.push(' ', nullifying);
    }
    lines.push(line);
  }

  return lines;
}

/**
 * A trinket's brief: its category, then rarity and attunement where it carries
 * them. Most trinkets are mundane and name only a category.
 *
 * @param {HeirloomValues} values - Header slot values
 * @param {(key: string) => string} t - Translator for the heirloom namespace
 * @returns {ReactNode[][]} Lines, each a list of fragments
 */
function trinketBrief(
  values: HeirloomValues,
  t: (key: string) => string,
): ReactNode[][] {
  const line: ReactNode[] = [];
  if (values.category !== undefined) {
    const category = inlineValue(values.category);
    line.push(typeof category === 'string' ? capitalize(category) : category);
  }
  if (values.rarity !== undefined) {
    const rarity = inlineValue(values.rarity);
    line.push(
      line.length ? ', ' : '',
      typeof rarity === 'string' && !line.length ? capitalize(rarity) : rarity,
    );
  }
  if (values.attunement !== undefined) {
    const attunement = attunementDetail(inlineValue(values.attunement));
    line.push(line.length ? ', ' : '', t('requiresAttunement'));
    if (attunement !== null) line.push(' ', attunement);
  }
  return line.length ? [line] : [];
}

/**
 * Item card component.
 *
 * @param {HeirloomProps} props - Wrapper props
 * @returns {JSX.Element} The heirloom section
 */
const Heirloom: React.FC<HeirloomProps> = ({
  kind = 'heirloom',
  children,
  ...slots
}) => {
  const t = useTranslations('library.heirloom');
  const nodes = cleanChildren(children);
  const { entries, kept } = splitSlotRuns(nodes, HEIRLOOM_SLOT_NAMES);
  const values: HeirloomValues = Object.fromEntries(
    collectSlotEntries(HEIRLOOM_SLOT_NAMES, slots, entries).map((entry) => [
      entry.name,
      entry.value,
    ]),
  );

  const lines =
    kind === 'trinket' ? trinketBrief(values, t) : briefLines(values, t);
  const rows = rowsFor(kind).filter((name) => values[name] !== undefined);

  return (
    <HeirloomValuesContext.Provider value={values}>
      <section data-heirloom data-item-kind={kind}>
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
        {rows.length > 0 && (
          <p data-slot-grid data-item-stats>
            {rows.map((name) => (
              <SlotRow key={name} name={name} host='Trinket'>
                {inlineValue(values[name])}
              </SlotRow>
            ))}
          </p>
        )}
        {kept}
      </section>
    </HeirloomValuesContext.Provider>
  );
};

Heirloom.displayName = 'Heirloom';

/**
 * Trinket kind wrapper around the item card.
 *
 * @param {Omit<HeirloomProps, 'kind'>} props - Card props
 * @returns {JSX.Element} The trinket section
 */
export const Trinket: React.FC<Omit<HeirloomProps, 'kind'>> = (props) => (
  <Heirloom kind='trinket' {...props} />
);

Trinket.displayName = 'Trinket';

export default Heirloom;
