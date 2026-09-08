/**
 * @fileoverview Monster stat block.
 * @description Size, type and alignment read as the italic line a sheet opens
 * with; defences and ability scores print as the two tables a reader expects;
 * the rest print as labelled rows.
 *
 * @module modules/library/presentation/components/slots/Monster
 * @version 0.2.0
 * @author Typeir
 * @since 2026-09-04
 */

'use client';

import {
  DataTable,
  type DataTableColumn,
  type DataTableRow,
} from '@/lib/components/ui/dataTable';
import {
  abilityCell,
  challengeFor,
  challengeLabel,
  signed,
  tierBonusFor,
  xpFor,
} from '@/modules/library/domain/derive';
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
 * Props for the stat block
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
 * Identity slots, in the order the opening line speaks them.
 */
const IDENTITY_SLOTS: readonly MonsterSlotName[] = [
  'size',
  'type',
  'alignment',
];

/**
 * A slot value as text, for the values the card does arithmetic on.
 *
 * @param {ReactNode} value - Slot value
 * @returns {string | null} Trimmed text, or null when the slot was not written
 */
function textOf(value: ReactNode): string | null {
  if (value === undefined) return null;
  const inline = inlineValue(value);
  return typeof inline === 'string' || typeof inline === 'number'
    ? String(inline)
    : null;
}

/**
 * A table of slot columns
 *
 * @param {object} props - Table props
 * @param {readonly MonsterSlotName[]} props.names - Slots to print, in order
 * @param {Partial<Record<MonsterSlotName, ReactNode>>} props.values - Values
 * @param {(name: MonsterSlotName) => ReactNode} props.cell - Cell renderer
 * @param {string} props.mark - Data attribute naming the table, without the `data-` prefix
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
  const columns: DataTableColumn[] = present.map((name) => ({
    key: name,
    header: t(slotLabelKey(name, 'Monster')),
  }));
  const rows: DataTableRow[] = [
    {
      key: 'values',
      cells: present.map((name) => ({
        content: cell(name),
        dataAttributes: { slot: name },
      })),
    },
  ];
  return (
    <DataTable
      columns={columns}
      rows={rows}
      className={styles.statTable}
      dataAttributes={{ [mark]: 'true' }}
    />
  );
}

/**
 * Monster stat block component.
 *
 * @param {MonsterProps} props - Stat block props
 * @returns {JSX.Element} The monster section
 */
const Monster: React.FC<MonsterProps> = ({ children, ...slots }) => {
  const defaults = useTranslations('library.monster');
  const { values, kept } = readSlots(children, MONSTER_SLOT_NAMES, slots, true);

  const hasIdentity = IDENTITY_SLOTS.some((name) => values[name] !== undefined);
  const identity = (name: MonsterSlotName): ReactNode =>
    values[name] === undefined ? (
      <span data-derived-from='default'>{defaults(name)}</span>
    ) : (
      inlineValue(values[name])
    );

  const writtenChallenge = textOf(values.challenge);
  const writtenXp = textOf(values.xp);
  const derivedChallenge =
    writtenChallenge === null && writtenXp !== null
      ? challengeFor(writtenXp)
      : null;
  const derivedXp =
    writtenXp === null && writtenChallenge !== null
      ? xpFor(writtenChallenge)
      : null;
  const challenge =
    writtenChallenge ??
    (derivedChallenge === null ? null : challengeLabel(derivedChallenge));

  const derivedTier =
    values.tierBonus === undefined && challenge !== null
      ? tierBonusFor(challenge)
      : null;

  const listSlots = MONSTER_LIST_SLOTS.filter((name) => {
    if (name === 'xp') return false;
    if (name === 'challenge') return challenge !== null;
    if (name === 'tierBonus') {
      return values.tierBonus !== undefined || derivedTier !== null;
    }
    return values[name] !== undefined;
  });

  const hasDefences = DEFENCE_SLOTS.some((n) => values[n] !== undefined);
  const hasAbilities = ABILITY_SLOTS.some((n) => values[n] !== undefined);

  return (
    <section data-monster>
      {hasIdentity && (
        <p className={styles.brief} data-monster-identity>
          <em>
            {identity('size')} {identity('type')}, {identity('alignment')}
          </em>
        </p>
      )}

      {hasDefences && (
        <SlotTable
          names={DEFENCE_SLOTS}
          values={values}
          cell={(name) => inlineValue(values[name])}
          mark='monster-defences'
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
          mark='monster-abilities'
        />
      )}

      {listSlots.length > 0 && (
        <p data-slot-grid data-monster-stats>
          {listSlots.map((name) => (
            <SlotRow key={name} name={name} host='Monster'>
              {name === 'tierBonus' && derivedTier !== null ? (
                <span data-derived-from='challenge'>{signed(derivedTier)}</span>
              ) : name === 'challenge' ? (
                <>
                  {writtenChallenge ?? (
                    <span data-derived-from='xp'>{challenge}</span>
                  )}
                  {writtenXp !== null ? (
                    <span data-monster-xp> ({writtenXp} XP)</span>
                  ) : derivedXp !== null ? (
                    <span data-monster-xp data-derived-from='challenge'>
                      {' '}
                      ({derivedXp} XP)
                    </span>
                  ) : null}
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
