/**
 * @fileoverview Heirloom attributes list.
 * @description Where an author writes `<Attributes />` inside an heirloom,
 * the item's number slots print there as a labelled list.
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
import styles from './slots.module.scss';

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
 * @property {string} [except] - Slot names to withhold, whitespace or comma separated
 */
export type AttributesProps = Partial<
  Record<HeirloomSlotName, boolean | string>
> & {
  except?: string;
};

/**
 * Whether an attribute was written.
 *
 * @param {boolean | string | undefined} value - Attribute value
 * @returns {boolean} True when the name was asked for
 */
const asked = (value: boolean | string | undefined): boolean =>
  value === true || value === '' || value === 'true';

/**
 * Slot names the marker prints, in schema order.
 *
 * @param {HeirloomValues} values - Header slot values
 * @param {AttributesProps} props - Marker props
 * @returns {HeirloomSlotName[]} Names to print
 */
function selected(
  values: HeirloomValues,
  props: AttributesProps,
): HeirloomSlotName[] {
  const carried = STAT_SLOTS.filter((name) => values[name] !== undefined);
  const named = carried.filter((name) => asked(props[name]));
  if (named.length > 0) return named;
  const withheld = new Set(
    (props.except ?? '').split(/[\s,]+/).filter(Boolean),
  );
  return carried.filter((name) => !withheld.has(name));
}

/**
 * The item's numbers as a labelled list.
 *
 * @param {AttributesProps} props - Marker props
 * @returns {JSX.Element | null} The list, or null when the item carries none
 */
const Attributes: React.FC<AttributesProps> = (props) => {
  const values = useContext(HeirloomValuesContext);
  const names = selected(values, props);
  if (names.length === 0) return null;

  return (
    <div className={styles.attributesCard} data-heirloom-stats>
      {names.map((name) => (
        <SlotRow key={name} name={name}>
          {inlineValue(values[name])}
          {name === 'damage' && values.versatile !== undefined && (
            <> ({inlineValue(values.versatile)})</>
          )}
        </SlotRow>
      ))}
    </div>
  );
};

Attributes.displayName = 'Attributes';

export default Attributes;
