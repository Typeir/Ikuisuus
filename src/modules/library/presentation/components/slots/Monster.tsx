/**
 * @fileoverview Monster stat block.
 * @description Size, type and alignment read as the italic line a sheet opens
 * with; defences and ability scores print as the two tables a reader expects;
 * the rest print as labelled rows.
 *
 * Challenge rating and XP are separate values that print as one line, so a
 * sheet no longer carries `3 (700 XP)` as a single string with a number buried
 * in it.
 *
 * Two numbers are worked out rather than read. An ability score prints its own
 * modifier, so no sheet carries `18 (+4)` where the `(+4)` can fall out of step
 * with the 18. A tier bonus follows from the challenge rating by the table in
 * `Monster Stat Blocks`, so it is written only where a sheet means to override
 * it — and a sheet that does is marked, so the exception is visible.
 *
 * @module modules/library/presentation/components/slots/Monster
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-04
 */

'use client';

import { abilityCell, signed, tierBonusFor } from '@/modules/library/domain/derive';
import {
  ABILITY_SLOTS,
  MONSTER_LIST_SLOTS,
  MONSTER_SLOT_NAMES,
  slotLabelKey,
  type MonsterSlotName,
  type SlotProps,
} from '@/modules/library/domain/slots';
import { useTranslations } from 'next-intl';
import React, { type ReactNode } from 'react';
import { inlineValue, readSlots, SlotRow } from './slotElements';
import styles from './slots.module.scss';

/**
 * Props for the stat block: one optional prop per slot, plus the body.
 */
export type MonsterProps = SlotProps<MonsterSlotName> & {
  children?: ReactNode;
};

/**
 * Defence columns, in table order.
 */
const DEFENCE_SLOTS: readonly MonsterSlotName[] = [
  'armorClass',
  'hitPoints',
  'speed',
];

/**
 * A table of slot columns: labels across the head, values across the body.
 *
 * @param {object} props - Table props
 * @param {readonly MonsterSlotName[]} props.names - Slots to print, in order
 * @param {Partial<Record<MonsterSlotName, ReactNode>>} props.values - Values
 * @param {(name: MonsterSlotName) => ReactNode} props.cell - Cell renderer
 * @param {string} props.mark - Data attribute naming the table
 * @returns {JSX.Element} The table
 */
function SlotTable({
  names,
  values,
  cell,
  mark,
}: {
  names: readonly MonsterSlotName[];
  values: Partial<Record<MonsterSlotName, ReactNode>>;
  cell: (name: MonsterSlotName) => ReactNode;
  mark: string;
}): React.JSX.Element {
  const t = useTranslations('library');
  const present = names.filter((name) => values[name] !== undefined);
  return (
    <table className={styles.statTable} {...{ [mark]: '' }}>
      <thead>
        <tr>
          {present.map((name) => (
            <th key={name} scope='col'>
              {t(slotLabelKey(name, 'Monster'))}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          {present.map((name) => (
            <td key={name} data-slot={name}>
              {cell(name)}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}

/**
 * Monster stat block component.
 *
 * @param {MonsterProps} props - Stat block props
 * @returns {JSX.Element} The monster section
 */
const Monster: React.FC<MonsterProps> = ({ children, ...slots }) => {
  const { values, kept } = readSlots(children, MONSTER_SLOT_NAMES, slots);

  const identity = (['size', 'type', 'alignment'] as MonsterSlotName[])
    .filter((name) => values[name] !== undefined)
    .map((name) => inlineValue(values[name]));

  const derivedTier =
    values.tierBonus === undefined && values.challenge !== undefined
      ? tierBonusFor(String(inlineValue(values.challenge)))
      : null;

  /* Challenge and XP are two values; the card sets them beside each other so
     the sheet no longer hides one inside the other's string. */
  const xp = values.xp === undefined ? null : inlineValue(values.xp);

  const listSlots = MONSTER_LIST_SLOTS.filter((name) => name !== 'xp').filter(
    (name) =>
      values[name] !== undefined ||
      (name === 'tierBonus' && derivedTier !== null),
  );

  const hasDefences = DEFENCE_SLOTS.some((n) => values[n] !== undefined);
  const hasAbilities = ABILITY_SLOTS.some((n) => values[n] !== undefined);

  return (
    <section data-monster>
      {identity.length > 0 && (
        <p className={styles.brief} data-monster-identity>
          <em>
            {identity[0]}
            {identity.length > 1 && ' '}
            {identity[1]}
            {identity.length > 2 && ', '}
            {identity[2]}
          </em>
        </p>
      )}

      {hasDefences && (
        <SlotTable
          names={DEFENCE_SLOTS}
          values={values}
          cell={(name) => inlineValue(values[name])}
          mark='data-monster-defences'
        />
      )}

      {hasAbilities && (
        <SlotTable
          names={ABILITY_SLOTS}
          values={values}
          cell={(name) => {
            const score = values[name];
            return typeof score === 'string'
              ? abilityCell(score)
              : inlineValue(score);
          }}
          mark='data-monster-abilities'
        />
      )}

      {listSlots.length > 0 && (
        <p data-slot-grid data-monster-stats>
          {listSlots.map((name) => (
            <SlotRow key={name} name={name} host='Monster'>
              {name === 'tierBonus' && derivedTier !== null ? (
                <span data-derived-from='challenge'>{signed(derivedTier)}</span>
              ) : name === 'challenge' && xp !== null ? (
                <>
                  {inlineValue(values.challenge)}
                  <span data-monster-xp> ({xp} XP)</span>
                </>
              ) : (
                inlineValue(values[name])
              )}
            </SlotRow>
          ))}
        </p>
      )}

      <div data-monster-body>{kept}</div>
    </section>
  );
};

Monster.displayName = 'Monster';

export default Monster;
