/**
 * @fileoverview Spell card.
 * @description Replaces the hand-written blockquote stat block. Level and
 * school become the italic brief the way an heirloom's rarity and attunement
 * do, and the rest print as labelled rows above the body.
 *
 * Casting time is the `cost` slot, not a slot of its own: a cast spends the
 * same tempo currency a feature spends, so `1 Major Action`, `1 Reaction` and
 * `1 Reflex` mean here exactly what they mean there, and a spell that waits on
 * something carries `trigger` beside it. The row is labelled Casting Time
 * through the host's label override, so the page keeps the word a reader
 * expects while the schema keeps one currency.
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
import { capitalize } from './text';
import styles from './slots.module.scss';

/**
 * Props for the spell card: one optional prop per header slot, plus the body.
 */
export type SpellProps = SlotProps<SpellSlotName> & {
  children?: ReactNode;
};

/**
 * Slots that print as rows, in display order. Level, school and ritual are
 * spoken by the brief instead.
 */
const ROW_SLOTS: readonly SpellSlotName[] = [
  'cost',
  'trigger',
  'range',
  'targets',
  'duration',
  'components',
  'save',
  'overcast',
];

/**
 * The brief: what kind of spell this is. A cantrip names its school and says
 * cantrip; anything else takes an ordinal.
 *
 * @param {ReactNode} level - Level slot
 * @param {ReactNode} school - School slot
 * @param {ReactNode} ritual - Ritual slot
 * @param {(key: string) => string} t - Translator over `library.spell`
 * @returns {ReactNode[]} Brief fragments; empty when neither slot was written
 */
function briefLine(
  level: ReactNode,
  school: ReactNode,
  ritual: ReactNode,
  t: (key: string) => string,
): ReactNode[] {
  const phrase =
    level === undefined ? null : spellLevelPhrase(String(inlineValue(level)));
  const named =
    typeof school === 'string' ? capitalize(school.trim()) : school;

  const parts: ReactNode[] =
    phrase === 'Cantrip'
      ? named === undefined
        ? [t('cantrip')]
        : [named, ` ${t('cantrip').toLowerCase()}`]
      : phrase && named !== undefined
        ? [`${phrase} `, named]
        : phrase
          ? [`${phrase} ${t('kind')}`]
          : named !== undefined
            ? [named]
            : [];

  /* The corpus writes this as a parenthetical on the level line, and writes it
     two ways — `(Ritual)` and `(ritual)`. The slot holds the fact and the card
     spells it, so the casing cannot drift again. */
  if (parts.length > 0 && ritual !== undefined && ritual !== 'false') {
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
  const brief = briefLine(values.level, values.school, values.ritual, t);
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
