/**
 * @fileoverview Slot elements and slot helpers.
 * @description Generates one inline element per schema row (`<Cost>`,
 * `<Attunement>`, …) and provides the helpers both parents share: splitting a
 * paragraph of slot elements out of children and merging attribute slots with
 * element slots. Labels come from the message catalogue, never from the
 * content; identity is the generated `displayName`, never `props.mdxType`.
 *
 * @module modules/library/presentation/components/slots/slotElements
 * @version 0.4.0
 * @author Typeir
 * @since 2026-09-02
 */

'use client';

import {
  SLOT_ELEMENT_NAMES,
  SLOT_NAME_BY_ELEMENT,
  SLOT_NAMES,
  slotLabelKey,
  type SlotElementName,
  type SlotName,
  type SlotValue,
} from '@/modules/library/domain/slots';
import { useTranslations } from 'next-intl';
import React, { type ReactNode } from 'react';
import styles from './slots.module.scss';

export type { SlotName } from '@/modules/library/domain/slots';

/**
 * Slot name of a React node, read from the component's `displayName`.
 *
 * @param {ReactNode} node - Node to inspect
 * @returns {SlotName | null} Slot name, or null when the node is not a slot
 */
export function slotNameOf(node: ReactNode): SlotName | null {
  if (!React.isValidElement(node)) return null;
  const type = node.type as { displayName?: string; name?: string } | string;
  if (typeof type === 'string') return null;
  const displayName = type.displayName || type.name || '';
  return SLOT_NAME_BY_ELEMENT[displayName] ?? null;
}

/**
 * Whether a React node is a slot element.
 *
 * @param {ReactNode} node - Node to test
 * @returns {boolean} True when the node is a slot element
 */
export function isSlotNode(node: ReactNode): boolean {
  return slotNameOf(node) !== null;
}

/**
 * Children with whitespace-only strings removed.
 *
 * @param {ReactNode} children - Node children
 * @returns {ReactNode[]} Filtered children
 */
export function cleanChildren(children: ReactNode): ReactNode[] {
  return React.Children.toArray(children).filter((node) => {
    if (typeof node === 'string') {
      return node.trim().length > 0;
    }
    return true;
  });
}

/**
 * One slot to render.
 *
 * @property {SlotName} name - Slot name
 * @property {ReactNode} value - Value as MDX delivered it: text, or the
 * fragment the attribute rewrite built from a shortcode-bearing string
 */
export interface SlotEntry {
  name: SlotName;
  value: ReactNode;
}

/**
 * Splits paragraphs made only of the parent's own slot elements (the element
 * form) out of a node list. A paragraph carrying any other content, or a slot
 * that belongs to another parent, stays in the body.
 *
 * @param {ReactNode[]} nodes - Cleaned child nodes
 * @param {readonly SlotName[]} names - Slot names the parent accepts
 * @returns {{ entries: SlotEntry[]; kept: ReactNode[] }} Slot entries, and the
 * nodes that remain once slot paragraphs are removed
 */
export function splitSlotRuns(
  nodes: ReactNode[],
  names: readonly SlotName[],
): {
  entries: SlotEntry[];
  kept: ReactNode[];
} {
  const entries: SlotEntry[] = [];
  const kept: ReactNode[] = [];
  const accepted = new Set<SlotName>(names);

  for (const node of nodes) {
    const isParagraph =
      React.isValidElement(node) &&
      typeof node.type === 'string' &&
      node.type === 'p';
    if (!isParagraph) {
      kept.push(node);
      continue;
    }

    const kids = cleanChildren(
      (node.props as { children?: ReactNode }).children,
    );
    const allSlots =
      kids.length > 0 &&
      kids.every((kid) => {
        const name = slotNameOf(kid);
        return name !== null && accepted.has(name);
      });
    if (!allSlots) {
      kept.push(node);
      continue;
    }

    for (const kid of kids) {
      const name = slotNameOf(kid);
      if (!name) continue;
      const value = (kid as React.ReactElement<{ children?: ReactNode }>).props
        .children;
      entries.push({ name, value });
    }
  }

  return { entries, kept };
}

/**
 * Slot entries of a parent in schema order: attribute values first, then
 * element-form values whose slot no attribute already filled.
 *
 * @param {readonly N[]} names - The parent's slot names in display order
 * @param {Partial<Record<N, SlotValue>>} props - The parent's props
 * @param {SlotEntry[]} childEntries - Entries from the element form
 * @returns {SlotEntry[]} Entries to render
 */
export function collectSlotEntries<N extends SlotName>(
  names: readonly N[],
  props: Partial<Record<N, SlotValue>>,
  childEntries: SlotEntry[],
): SlotEntry[] {
  const entries: SlotEntry[] = [];
  for (const name of names) {
    const value = props[name];
    if (value === undefined) continue;
    entries.push({ name, value: value as ReactNode });
  }
  const filled = new Set(entries.map((entry) => entry.name));
  for (const entry of childEntries) {
    if (filled.has(entry.name)) continue;
    entries.push(entry);
  }
  return entries;
}

/**
 * Label + value row for one slot. Label comes from the message catalogue and
 * is separated from the value by the site's colon convention.
 *
 * @param {object} props - Row props
 * @param {SlotName} props.name - Slot name, drives label key and data attribute
 * @param {ReactNode} [props.children] - Slot value
 * @returns {JSX.Element} The row
 */
export function SlotRow({
  name,
  children,
}: {
  name: SlotName;
  children?: ReactNode;
}): React.JSX.Element {
  const t = useTranslations('library');
  return (
    <span className={styles.row} data-slot={name}>
      <span className={styles.label} data-slot-label>
        {t(slotLabelKey(name))}
      </span>
      <span data-slot-value>{children}</span>
    </span>
  );
}

/**
 * Slot element component type.
 */
export type SlotElement = React.FC<{ children?: ReactNode }>;

/**
 * Creates the element for one schema row; its `displayName` is the authored
 * element name and its identity.
 *
 * @param {SlotName} name - Slot name
 * @returns {SlotElement} The slot element
 */
function makeSlot(name: SlotName): SlotElement {
  const Component: SlotElement = ({ children }) => (
    <SlotRow name={name}>{children}</SlotRow>
  );
  Component.displayName = SLOT_ELEMENT_NAMES[name];
  return Component;
}

/**
 * Generated slot elements keyed by authored element name.
 */
export const slotElements = Object.fromEntries(
  SLOT_NAMES.map((name) => [SLOT_ELEMENT_NAMES[name], makeSlot(name)]),
) as Record<SlotElementName, SlotElement>;

/**
 * Slot element for a slot name.
 *
 * @param {SlotName} name - Slot name
 * @returns {SlotElement} The generated element
 */
export function slotElementOf(name: SlotName): SlotElement {
  return slotElements[SLOT_ELEMENT_NAMES[name]];
}

export const {
  Rarity,
  Attunement,
  Base,
  Quality,
  Enchantment,
  Damage,
  Versatile,
  Reach,
  Range,
  ArmorClass,
  Stealth,
  Mastery,
  MasterfulBlow,
  Charges,
  Burden,
  Focus,
  Nullifying,
  Cost,
  Targets,
  Recharge,
} = slotElements;
