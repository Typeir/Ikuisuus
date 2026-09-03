/**
 * @fileoverview Heirloom attributes list.
 * @description Where an author writes `<Attributes />` inside an heirloom,
 * the item's number slots print there as a labelled list. The values reach it
 * through context rather than a prop or an anchor the card matches by name,
 * so the marker can sit anywhere under the heading that introduces it.
 *
 * @module modules/library/presentation/components/slots/Attributes
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-03
 */

'use client';

import {
  STAT_SLOTS,
  type HeirloomSlotName,
} from '@/modules/library/domain/slots';
import React, { createContext, useContext, type ReactNode } from 'react';
import { inlineValue, SlotRow } from './slotElements';

/**
 * The heirloom's header slot values, keyed by slot name.
 */
export type HeirloomValues = Partial<Record<HeirloomSlotName, ReactNode>>;

/**
 * Values of the heirloom being rendered; empty outside one.
 */
export const HeirloomValuesContext = createContext<HeirloomValues>({});

/**
 * Props for the attributes marker.
 *
 * @property {string} [only] - Slot names to print, whitespace or comma separated; all the item carries when absent
 */
export interface AttributesProps {
  only?: string;
}

/**
 * Slot names the marker prints, in schema order.
 *
 * @param {HeirloomValues} values - Header slot values
 * @param {string} [only] - Requested slot names
 * @returns {HeirloomSlotName[]} Names to print
 */
function selected(
  values: HeirloomValues,
  only?: string,
): HeirloomSlotName[] {
  const carried = STAT_SLOTS.filter((name) => values[name] !== undefined);
  if (!only) return [...carried];
  const asked = new Set(only.split(/[\s,]+/).filter(Boolean));
  return carried.filter((name) => asked.has(name));
}

/**
 * The item's numbers as a labelled list.
 *
 * @param {AttributesProps} props - Marker props
 * @returns {JSX.Element | null} The list, or null when the item carries none
 */
const Attributes: React.FC<AttributesProps> = ({ only }) => {
  const values = useContext(HeirloomValuesContext);
  const names = selected(values, only);
  if (names.length === 0) return null;

  return (
    <ul data-heirloom-stats>
      {names.map((name) => (
        <li key={name}>
          <SlotRow name={name}>
            {inlineValue(values[name])}
            {name === 'damage' && values.versatile !== undefined && (
              <> ({inlineValue(values.versatile)})</>
            )}
          </SlotRow>
        </li>
      ))}
    </ul>
  );
};

Attributes.displayName = 'Attributes';

export default Attributes;
