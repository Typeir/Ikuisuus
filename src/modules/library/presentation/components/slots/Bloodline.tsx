/**
 * @fileoverview Bloodline card.
 * @description Wraps a bloodline page. The card states the boon budget and
 * otherwise hands the page's own content straight through, because a
 * bloodline's ability scores, speeds, senses, size, creature types and age
 * live in its two Core Features tables, whose cells carry `<Tooltip>` blocks
 * that a quoted attribute would flatten into literal text.
 *
 * @module modules/library/presentation/components/slots/Bloodline
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-07
 */

import {
  BLOODLINE_SLOT_NAMES,
  type BloodlineSlotName,
  type SlotProps,
} from '@/modules/library/domain/slots';
import React, { type ReactNode } from 'react';
import { readSlots, slotElementOf } from './slotElements';

/**
 * Props for the card: one optional prop per slot, plus the body.
 *
 * @property {ReactNode} [children] - The page's own content
 */
export type BloodlineProps = SlotProps<BloodlineSlotName> & {
  children?: ReactNode;
};

/**
 * Bloodline card component.
 *
 * @param {BloodlineProps} props - Card props
 * @returns {JSX.Element} The bloodline section
 */
const Bloodline: React.FC<BloodlineProps> = ({ children, ...slots }) => {
  const { values, kept } = readSlots(
    React.Children.toArray(children),
    BLOODLINE_SLOT_NAMES,
    slots,
  );
  const entries = BLOODLINE_SLOT_NAMES.filter(
    (name) => values[name] !== undefined,
  );

  return (
    <section data-bloodline='true'>
      {entries.length > 0 && (
        <p data-slot-grid>
          {entries.map((name) => {
            const Slot = slotElementOf(name);
            return <Slot key={name}>{values[name] as ReactNode}</Slot>;
          })}
        </p>
      )}
      {kept}
    </section>
  );
};

Bloodline.displayName = 'Bloodline';

export default Bloodline;
