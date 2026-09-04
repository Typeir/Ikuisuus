/**
 * @fileoverview Vocation core traits card.
 * @description The core traits table, one slot per row. Every vocation opens
 * with the same eight rows in the same order, hand-built as a two-column
 * markdown table each time; the card takes the values and owns the shape, so
 * the rows cannot drift in order or wording between vocations.
 *
 * The progression table stays authored markdown: its columns differ per
 * vocation — Martial Arts and Focus for a Monk, something else for a Wizard —
 * so no fixed schema describes it.
 *
 * @module modules/library/presentation/components/slots/Vocation
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-04
 */

'use client';

import {
  VOCATION_SLOT_NAMES,
  type SlotProps,
  type VocationSlotName,
} from '@/modules/library/domain/slots';
import React, { type ReactNode } from 'react';
import { inlineValue, readSlots, SlotRow } from './slotElements';

/**
 * Props for the vocation card: one optional prop per core trait, plus the body.
 */
export type VocationProps = SlotProps<VocationSlotName> & {
  children?: ReactNode;
};

/**
 * Vocation card component.
 *
 * @param {VocationProps} props - Card props
 * @returns {JSX.Element} The vocation section
 */
const Vocation: React.FC<VocationProps> = ({ children, ...slots }) => {
  const { values, kept } = readSlots(children, VOCATION_SLOT_NAMES, slots);
  const rows = VOCATION_SLOT_NAMES.filter(
    (name) => values[name] !== undefined,
  );

  return (
    <section data-vocation>
      {rows.length > 0 && (
        <p data-slot-grid data-vocation-traits>
          {rows.map((name) => (
            <SlotRow key={name} name={name} host='Vocation'>
              {inlineValue(values[name])}
            </SlotRow>
          ))}
        </p>
      )}
      <div data-vocation-body>{kept}</div>
    </section>
  );
};

Vocation.displayName = 'Vocation';

export default Vocation;
