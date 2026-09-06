/**
 * @fileoverview Spell card.
 * @description Replaces the hand-written blockquote stat block.
 *
 * @module modules/library/presentation/components/slots/Spell
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-04
 */

'use client';

import { spellLevelPhrase } from '@/modules/library/domain/derive';
import {
  SPELL_SLOT_NAMES,
  type SlotProps,
  type SpellSlotName,
} from '@/modules/library/domain/slots';
import { useTranslations } from 'next-intl';
import React, { type ReactNode } from 'react';
import { inlineValue, readSlots, SlotRow } from './slotElements';
import { capitalize, flagOf } from './text';
import styles from './slots.module.scss';

/**
 * Props for the spell card: one optional prop per header slot, plus the body.
 */
export type SpellProps = SlotProps<SpellSlotName> & {
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
 * Rarity as the brief speaks it: capitalised, and silent for common, which
 * every spell is until it says otherwise.
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
 * The brief: what kind of spell this is.
 *
 * @param {ReactNode} level - Level slot
 * @param {ReactNode} rarity - Rarity slot
 * @param {ReactNode} school - School slot
 * @param {ReactNode} ritual - Ritual slot
 * @param {(key: string) => string} t - Translator over `library.spell`
 * @returns {ReactNode[]} Brief fragments; empty when no brief slot was written
 */
function briefLine(
  level: ReactNode,
  rarity: ReactNode,
  school: ReactNode,
  ritual: ReactNode,
  t: (key: string) => string,
): ReactNode[] {
  const phrase =
    level === undefined ? null : spellLevelPhrase(String(inlineValue(level)));
  const named =
    typeof school === 'string' ? capitalize(school.trim()) : school;
  const rare = rarityWord(rarity);
  const kind = named === undefined ? t('kind') : named;
  const rareKind: ReactNode[] = rare ? [`${rare} `, kind] : [kind];

  const parts: ReactNode[] =
    phrase === 'Cantrip'
      ? named === undefined && !rare
        ? [t('cantrip')]
        : [...(rare ? [`${rare} `] : []), ...(named === undefined ? [] : [named, ' ']), t('cantrip').toLowerCase()]
      : phrase
        ? [`${phrase} `, ...rareKind]
        : named !== undefined || rare
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
 * @param {SpellProps} props - Card props
 * @returns {JSX.Element} The spell section
 */
const Spell: React.FC<SpellProps> = ({ children, ...slots }) => {
  const t = useTranslations('library.spell');
  const { values, kept } = readSlots(children, SPELL_SLOT_NAMES, slots);
  const brief = briefLine(values.level, values.rarity, values.school, values.ritual, t);
  const rows = ROW_SLOTS.filter((name) => values[name] !== undefined);

  return (
    <section data-spell>
      {brief.length > 0 && (
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
      <div data-spell-body>{kept}</div>
    </section>
  );
};

Spell.displayName = 'Spell';

export default Spell;
