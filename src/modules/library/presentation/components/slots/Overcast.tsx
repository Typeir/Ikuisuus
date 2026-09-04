/**
 * @fileoverview Overcast slot, inline or block.
 * @description Most spells overcast in a clause — *the spell gains 1d6 damage*
 * — and print it as a row like any other slot. Some overcast into a table:
 * Charm, Hold and Dominate each gain reach up a ladder of creature types by
 * slot level, and no clause says that.
 *
 * So this slot renders either way, and the author chooses by how they write it.
 * A value on the tag is a row. An `<Overcast>` element wrapping block content —
 * a table, a list, more than one paragraph — is a titled block beneath the
 * body. Nothing about the slot forces the shorter form.
 *
 * `at` names the slot level a tier begins at, because a spell may overcast in
 * steps: Imbue Weapon opens a damage strata at 5th and another at 7th, each
 * with its own table.
 *
 * @module modules/library/presentation/components/slots/Overcast
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-04
 */

'use client';

import { slotLabelKey } from '@/modules/library/domain/slots';
import { useTranslations } from 'next-intl';
import React, { type ReactNode } from 'react';
import { cleanChildren, SlotRow } from './slotElements';
import styles from './slots.module.scss';

/**
 * Element names that make a value block content rather than a phrase.
 */
const BLOCK_TAGS = new Set([
  'p',
  'table',
  'ul',
  'ol',
  'blockquote',
  'pre',
  'div',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
]);

/**
 * Whether a node list reads as block content.
 *
 * Node count says nothing: a one-line value carrying a shortcode arrives as
 * several inline nodes — text, the rendered dice, text — and is still a phrase.
 * What separates the two is a block element among the children, which is what
 * MDX produces for content set off by blank lines.
 *
 * @param {ReactNode[]} nodes - Cleaned children
 * @returns {boolean} True when the value wants a block
 */
function isBlockContent(nodes: ReactNode[]): boolean {
  return nodes.some(
    (node) =>
      React.isValidElement(node) &&
      typeof node.type === 'string' &&
      BLOCK_TAGS.has(node.type),
  );
}

/**
 * Overcast slot component.
 *
 * @param {object} props - Slot props
 * @param {string} [props.at] - Slot level this tier begins at, e.g. `5th+`
 * @param {ReactNode} [props.children] - Slot value or block content
 * @returns {JSX.Element} A slot row, or a titled block
 */
const Overcast: React.FC<{ at?: string; children?: ReactNode }> = ({
  at,
  children,
}) => {
  const t = useTranslations('library');
  const nodes = cleanChildren(children);
  const label = at ? `${t(slotLabelKey('overcast'))} (${at})` : t(slotLabelKey('overcast'));

  if (!isBlockContent(nodes)) {
    return (
      <SlotRow name='overcast' label={label}>
        {children}
      </SlotRow>
    );
  }

  return (
    <section data-overcast data-overcast-at={at}>
      <p className={styles.overcastLabel} data-slot-label>
        {label}
      </p>
      {children}
    </section>
  );
};

Overcast.displayName = 'Overcast';

export default Overcast;
