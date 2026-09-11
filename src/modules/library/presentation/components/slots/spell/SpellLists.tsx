/**
 * @fileoverview The lists a spell appears on.
 * @description A spell page declares the vocations that can learn it, and the
 * block writes the links.
 *
 * @module modules/library/presentation/components/slots/spell/SpellLists
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-07
 */

'use client';

import { splitList } from '@/modules/library/domain/progression';
import {
  spellListEntries,
  type SpellListEntry,
} from '@/modules/library/domain/spellLists';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import React from 'react';

/**
 * Props of the block.
 *
 * @property {string | string[]} [members] - Vocation slugs, or `vocation/specialization`
 */
export interface SpellListsProps {
  members?: string | string[];
}

/**
 * Spell lists block component.
 *
 * @param {SpellListsProps} props - Block props
 * @returns {JSX.Element | null} The block, or nothing when no list is named
 */
const SpellLists: React.FC<SpellListsProps> = ({ members }) => {
  const locale = useLocale();
  const t = useTranslations('library.spellLists');
  const slugs = Array.isArray(members) ? members : splitList(members);
  const entries: SpellListEntry[] = spellListEntries(slugs, locale);

  if (entries.length === 0) return null;

  return (
    <section data-spell-lists>
      <h4>{t('heading')}</h4>
      <p>{t('lead')}</p>
      <ul>
        {entries.map((entry) => (
          <li key={entry.slug}>
            <Link href={entry.link}>
              <em>{t('name', { name: entry.name })}</em>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};

SpellLists.displayName = 'SpellLists';

export default SpellLists;
