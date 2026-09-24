/**
 * @fileoverview Reads a host's slots from its props and its children.
 * @description Helpers every slot host shares for telling slot nodes apart and reading their values in schema order
 *
 * @module modules/library/presentation/components/slots/utils/slotReading
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-24
 */

import { SLOT_NAME_ATTRIBUTE } from '@/lib/md/desugarSlotAttributes';
import {
  SLOT_ELEMENT_NAMES,
  SLOT_NAME_BY_ELEMENT,
  type SlotName,
  type SlotValue,
} from '@/modules/library/domain/slots';
import React, { type ReactNode } from 'react';

/**
 * Slot name of a React node, read from the component's `displayName`.
 *
 * @param {ReactNode} node - Node to inspect
 * @returns {SlotName | null} Slot name, or null when the node is not a slot
 */
export function slotNameOf(node: ReactNode): SlotName | null {
  if (!React.isValidElement(node)) return null;

  /* The compile step stamps the slot name, because a client reference hides
     the component's identity from a server render. */
  const stamped = (node.props as Record<string, unknown>)?.[
    SLOT_NAME_ATTRIBUTE
  ];
  if (typeof stamped === 'string' && stamped in SLOT_ELEMENT_NAMES) {
    return stamped as SlotName;
  }

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
 * Renders a slot value as it arrived
 *
 * @param {ReactNode} value - Slot value
 * @returns {ReactNode} Value ready to print
 */
export function inlineValue(value: ReactNode): ReactNode {
  return typeof value === 'string' ? value.trim() : value;
}

/**
 * One slot to render.
 *
 * @property {SlotName} name - Slot name
 * @property {ReactNode} value - Value as MDX delivered it
 */
export interface SlotEntry {
  name: SlotName;
  value: ReactNode;
}

/**
 * Splits the parent's own slot elements (the element form) out of a node list.
 *
 * @description Takes them as a paragraph made only of them, which is what MDX
 * builds from a run of inline elements.
 *
 * @param {ReactNode[]} nodes - Cleaned child nodes
 * @param {readonly SlotName[]} names - Slot names the parent accepts
 * @param {boolean} [standalone] - Also take a slot element that stands alone
 * @returns {{ entries: SlotEntry[]; kept: ReactNode[] }} Slot entries, and the
 * nodes that remain once the slot elements are removed
 */
export function splitSlotRuns(
  nodes: ReactNode[],
  names: readonly SlotName[],
  standalone = false,
): {
  entries: SlotEntry[];
  kept: ReactNode[];
} {
  const entries: SlotEntry[] = [];
  const kept: ReactNode[] = [];
  const accepted = new Set<SlotName>(names);

  for (const node of nodes) {
    const own = standalone ? slotNameOf(node) : null;
    if (own !== null && accepted.has(own)) {
      entries.push({
        name: own,
        value: (node as React.ReactElement<{ children?: ReactNode }>).props
          .children,
      });
      continue;
    }

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
 * Slot entries of a parent in schema order
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
 * A host's slot values keyed by slot name, and the children that remain once
 * element-form slot paragraphs are lifted out.
 *
 * @property {Partial<Record<N, ReactNode>>} values - Slot values by name
 * @property {ReactNode[]} kept - Body nodes
 */
export interface SlotReading<N extends SlotName> {
  values: Partial<Record<N, ReactNode>>;
  kept: ReactNode[];
}

/**
 * Reads a host's slots from both spellings at once
 *
 * @param {ReactNode} children - The host's children
 * @param {readonly N[]} names - Slot names the host accepts, in display order
 * @param {Partial<Record<N, SlotValue>>} props - The host's slot props
 * @returns {SlotReading<N>} Values and remaining body
 */
export function readSlots<N extends SlotName>(
  children: ReactNode,
  names: readonly N[],
  props: Partial<Record<N, SlotValue>>,
  standalone = false,
): SlotReading<N> {
  const nodes = cleanChildren(children);
  const { entries, kept } = splitSlotRuns(nodes, names, standalone);
  const values = Object.fromEntries(
    collectSlotEntries(names, props, entries).map((entry) => [
      entry.name,
      entry.value,
    ]),
  ) as Partial<Record<N, ReactNode>>;
  return { values, kept };
}
