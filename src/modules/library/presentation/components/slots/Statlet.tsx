/**
 * @fileoverview A stat block for something a sheet describes rather than is.
 * @description Sheets keep running into the same thing: a plating, a drone, a
 * summoned blade, a bound homunculus — something with defences of its own, and
 * often features of its own, that is not the creature the sheet is about. It
 * is the monster block over again at a smaller size, so it is written with the
 * monster's own slots; the only question is whether the thing is a creature or
 * an object, which decides what it has to say about itself.
 *
 * @module modules/library/presentation/components/slots/Statlet
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-08
 */

'use client';

import {
  ABILITY_SLOTS,
  MONSTER_SLOT_NAMES,
  type MonsterSlotName,
  type SlotProps,
} from '@/modules/library/domain/slots';
import React, { type ReactNode } from 'react';
import { isHeadingNode } from '../headingParts';
import { SlotTable } from './Monster';
import { inlineValue, readSlots, SlotRow } from './slotElements';
import styles from './slots.module.scss';

/**
 * What the thing is, which decides what it has to say about itself.
 */
export type StatletKind = 'object' | 'creature';

/**
 * Props for the block.
 *
 * @property {StatletKind} [kind] - Whether the thing is an object or a creature
 * @property {ReactNode} [children] - Its heading, then whatever it can do
 */
export type StatletProps = SlotProps<MonsterSlotName> & {
  kind?: StatletKind;
  children?: ReactNode;
};

/**
 * The defences each kind is measured by. An object does not move, and takes
 * nothing at all from a hit under its threshold.
 */
const DEFENCES: Record<StatletKind, readonly MonsterSlotName[]> = {
  creature: ['armorClass', 'hitPoints', 'speed'],
  object: ['armorClass', 'hitPoints', 'damageThreshold'],
};

/**
 * What each kind lists under its table, in order. An object has no mind to
 * save with, nothing to perceive with, and no language.
 */
const LISTS: Record<StatletKind, readonly MonsterSlotName[]> = {
  creature: [
    'saves',
    'skills',
    'resistances',
    'vulnerabilities',
    'immunities',
    'conditionImmunities',
    'senses',
    'languages',
  ],
  object: [
    'material',
    'resistances',
    'vulnerabilities',
    'immunities',
    'conditionImmunities',
  ],
};

/**
 * The line a thing opens with. A creature names its size, kind and bearing the
 * way a monster does; an object is only ever its size.
 *
 * @param {StatletKind} kind - What the thing is
 * @param {Partial<Record<MonsterSlotName, ReactNode>>} values - Its slots
 * @returns {ReactNode[]} The fragments, empty when it says nothing
 */
function briefOf(
  kind: StatletKind,
  values: Partial<Record<MonsterSlotName, ReactNode>>,
): ReactNode[] {
  const named = (kind === 'creature'
    ? (['size', 'type'] as const)
    : (['size'] as const)
  ).filter((name) => values[name] !== undefined);

  if (named.length === 0 && values.alignment === undefined) return [];

  const parts: ReactNode[] = named.map((name, index) => (
    <React.Fragment key={name}>
      {index > 0 ? ' ' : null}
      {inlineValue(values[name])}
    </React.Fragment>
  ));

  if (kind === 'creature' && values.alignment !== undefined) {
    parts.push(
      <React.Fragment key='alignment'>
        {parts.length > 0 ? ', ' : null}
        {inlineValue(values.alignment)}
      </React.Fragment>,
    );
  }

  return parts;
}

/**
 * Statlet component.
 *
 * @param {StatletProps} props - Block props
 * @returns {JSX.Element} The nested stat block
 */
const Statlet: React.FC<StatletProps> = ({
  kind = 'object',
  children,
  ...slots
}) => {
  const { values, kept } = readSlots(children, MONSTER_SLOT_NAMES, slots, true);

  /* The heading is the thing's name, and it opens the block rather than
     following the numbers, so it is taken out of the body first. */
  const nodes = React.Children.toArray(kept);
  const at = nodes.findIndex((node) => isHeadingNode(node));
  const heading = at === -1 ? null : nodes[at];
  const body = at === -1 ? nodes : nodes.filter((_, index) => index !== at);

  const brief = briefOf(kind, values);
  const defences = DEFENCES[kind].filter((n) => values[n] !== undefined);
  const lists = LISTS[kind].filter((n) => values[n] !== undefined);
  const abilities =
    kind === 'creature' && ABILITY_SLOTS.some((n) => values[n] !== undefined);

  return (
    <section data-statlet data-statlet-kind={kind}>
      {heading}

      {brief.length > 0 && (
        <p className={styles.brief} data-statlet-identity>
          <em>{brief}</em>
        </p>
      )}

      {defences.length > 0 && (
        <SlotTable
          names={defences}
          values={values}
          cell={(name) => inlineValue(values[name])}
          mark='statlet-defences'
        />
      )}

      {abilities && (
        <SlotTable
          names={ABILITY_SLOTS}
          values={values}
          cell={(name) => inlineValue(values[name])}
          mark='statlet-abilities'
        />
      )}

      {lists.length > 0 && (
        <p data-slot-grid data-statlet-stats>
          {lists.map((name) => (
            <SlotRow key={name} name={name} host='Monster'>
              {inlineValue(values[name])}
            </SlotRow>
          ))}
        </p>
      )}

      <div data-statlet-body>{body}</div>
    </section>
  );
};

Statlet.displayName = 'Statlet';

export default Statlet;
