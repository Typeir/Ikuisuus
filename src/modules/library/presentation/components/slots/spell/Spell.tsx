/**
 * @fileoverview Spell card.
 * @description Replaces the hand-written blockquote stat block.
 *
 * @module modules/library/presentation/components/slots/spell/Spell
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-04
 */

'use client';

import { useArticleMetadata } from '@/modules/library/application/context/ArticleMetadataContext';
import { markOf } from '@/modules/library/domain/costMark';
import { spellLevelPhrase } from '@/modules/library/domain/derive';
import {
  SPELL_SLOT_NAMES,
  type SlotProps,
  type SpellSlotName,
} from '@/modules/library/domain/slots';
import { useTranslations } from 'next-intl';
import React, { type ReactNode } from 'react';
import { CostMarkProvider } from '../feature/costMarkContext';
import { inlineValue, readSlots, SlotRow } from '../utils/slotElements';
import { capitalize, flagOf } from '../utils/text';
import styles from '../feature/slots.module.scss';

/**
 * Props for the spell card
 */
export type SpellProps = SlotProps<SpellSlotName> & {
  name?: string;
  children?: ReactNode;
};

/**
 * Slots that print as rows, in display order.
 */
const ROW_SLOTS: readonly SpellSlotName[] = [
  'cost',
  'trigger',
  'range',
  'targets',
  'duration',
  'components',
  'overcast',
];

/**
 * Slots the head takes out of the body.
 *
 * @description Overcasting is written where it is read, at the end of the
 * spell
 */
const HEAD_SLOTS: readonly SpellSlotName[] = SPELL_SLOT_NAMES.filter(
  (slot) => slot !== 'overcast',
);

/**
 * Rarity as the brief speaks it
 *
 * @param {ReactNode} rarity - Rarity slot
 * @returns {string | null} Word to print, or null for common
 */
function rarityWord(rarity: ReactNode): string | null {
  if (typeof rarity !== 'string') return null;
  const word = rarity.trim();
  return word === '' || word.toLowerCase() === 'common' ? null : capitalize(word);
}

/**
 * The brief
 *
 * @param {ReactNode} level - Level slot
 * @param {ReactNode} rarity - Rarity slot
 * @param {ReactNode} ritual - Ritual slot
 * @param {(key: string) => string} t - Translator over `library.spell`
 * @returns {ReactNode[]} Brief fragments; empty when no brief slot was written
 */
function briefLine(
  level: ReactNode,
  rarity: ReactNode,
  ritual: ReactNode,
  t: (key: string) => string,
): ReactNode[] {
  const phrase =
    level === undefined ? null : spellLevelPhrase(String(inlineValue(level)));
  const rare = rarityWord(rarity);
  const rareKind: ReactNode[] = rare ? [`${rare} `, t('kind')] : [t('kind')];

  const parts: ReactNode[] =
    phrase === 'Cantrip'
      ? rare
        ? [`${rare} `, t('cantrip').toLowerCase()]
        : [t('cantrip')]
      : phrase
        ? [`${phrase} `, ...rareKind]
        : rare
          ? rareKind
          : [];

  /* The corpus writes this as a parenthetical on the level line, and writes it
     two ways — `(Ritual)` and `(ritual)`. The slot holds the fact and the card
     spells it, so the casing cannot drift again. */
  if (parts.length > 0 && flagOf(ritual) !== false) {
    parts.push(` (${t('ritual')})`);
  }
  return parts;
}

/**
 * Spell card component.
 *
 * @description The card heads with the spell's name, taken from the article's
 * own metadata so no spell page has to write it twice — and only when the
 * article is that spell
 *
 * @param {SpellProps} props - Card props
 * @returns {JSX.Element} The spell section
 */
const Spell: React.FC<SpellProps> = ({ name: given, children, ...slots }) => {
  const t = useTranslations('library.spell');
  const { metadata } = useArticleMetadata();
  const { values: head, kept } = readSlots(children, HEAD_SLOTS, slots, true);
  const values: Partial<Record<SpellSlotName, ReactNode>> =
    slots.overcast === undefined
      ? head
      : { ...head, overcast: slots.overcast as ReactNode };
  const brief = briefLine(values.level, values.rarity, values.ritual, t);
  const ownPage =
    metadata?.contentType === 'spells' ? metadata?.title : undefined;
  const name = (given ?? ownPage ?? '').trim();
  /* The cost heads a named card, and falls back to a row on one with no head
     to carry it, so it is never dropped. */
  const rows = ROW_SLOTS.filter(
    (slot) =>
      values[slot] !== undefined && !(slot === 'cost' && name !== ''),
  );

  return (
    <section className={styles.spellCard} data-spell>
      {name !== '' && (
        <h2
          className={styles.spellHead}
          data-spell-name
          data-mark={markOf(undefined, values.cost)}>
          <span className={styles.headingTitle} data-heading-title>
            {name}
          </span>
          {values.cost !== undefined && (
            <span className={styles.cost} data-spell-cost>
              {inlineValue(values.cost)}
            </span>
          )}
          {brief.length > 0 && (
            <span className={styles.tag} data-spell-brief>
              {brief}
            </span>
          )}
        </h2>
      )}
      {name === '' && brief.length > 0 && (
        <p className={styles.brief} data-spell-brief>
          <em>{brief}</em>
        </p>
      )}
      {rows.length > 0 && (
        <p data-slot-grid data-spell-stats>
          {rows.map((name) => (
            <SlotRow key={name} name={name} host='Spell'>
              {inlineValue(values[name])}
            </SlotRow>
          ))}
        </p>
      )}
      <div data-spell-body>
        <CostMarkProvider mark={markOf(undefined, values.cost)}>
          {kept}
        </CostMarkProvider>
      </div>
    </section>
  );
};

Spell.displayName = 'Spell';

export default Spell;
