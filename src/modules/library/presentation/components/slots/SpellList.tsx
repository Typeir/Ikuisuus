/**
 * @fileoverview A creature's spell list
 * @module modules/library/presentation/components/slots/SpellList
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-07
 */

'use client';

import { DataTable, type DataTableColumn, type DataTableRow } from '@/lib/components/ui/dataTable';
import { CONTENT_SUBDIRS } from '@/lib/constants/contentPaths';
import { splitList } from '@/modules/library/domain/progression';
import { useSpellSources } from '@/modules/metadata-tables/application/hooks/useSpellSources';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import React, { type ReactNode } from 'react';
import { elementsNamed, type ColumnProps, type RowProps } from './columns';

/**
 * Props of the list.
 *
 * @property {string} [spells] - Comma-separated spell slugs in order
 * @property {ReactNode} [children] - Column elements
 */
export interface SpellListProps {
  spells?: string;
  children?: ReactNode;
}

/**
 * Where the rows come from; one constant so the fetch key stays stable.
 */
const SOURCES = ['/api/spells'];

/**
 * A slug as a title
 *
 * @param {string} slug - Spell slug
 * @returns {string} Title
 */
function humanize(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * The declared columns as cells aligned to the spells.
 *
 * @param {ReactNode} children - SpellList children
 * @param {string[]} slugs - Spells in order
 * @returns {Array<{ label: string; cells: ReactNode[] }>} Columns
 */
function extraColumns(children: ReactNode, slugs: string[]): Array<{ label: string; cells: ReactNode[] }> {
  return elementsNamed<ColumnProps>(children, 'Column').map((column) => {
    const { label, values } = column.props;
    if (values !== undefined) return { label, cells: splitList(values) };
    const cells: ReactNode[] = slugs.map(() => undefined);
    elementsNamed<RowProps>(column.props.children, 'Row').forEach((row, index) => {
      const at = row.props.at === undefined ? index : slugs.indexOf(String(row.props.at));
      if (at >= 0 && at < cells.length) cells[at] = row.props.children;
    });
    return { label, cells };
  });
}

/**
 * Spell list component.
 *
 * @param {SpellListProps} props - Props
 * @returns {JSX.Element | null} The table, or nothing without spells
 */
const SpellList: React.FC<SpellListProps> = ({ spells, children }) => {
  const locale = useLocale();
  const t = useTranslations('library.spellList');
  const slugs = splitList(spells).filter((slug) => slug !== '');
  const { spellData } = useSpellSources(SOURCES, locale, slugs.length ? slugs : ['-']);
  if (slugs.length === 0) return null;

  const bySlug = new Map(spellData.map((spell) => [spell.slug, spell]));
  const extras = extraColumns(children, slugs);
  const none = t('none');
  const cell = (value: ReactNode): ReactNode => (value === undefined || value === '' ? none : value);

  const columns: DataTableColumn[] = [
    { key: 'spell', header: t('spell') },
    { key: 'level', header: t('level') },
    { key: 'castingTime', header: t('castingTime') },
    { key: 'range', header: t('range') },
    { key: 'duration', header: t('duration') },
    ...extras.map((extra, index) => ({ key: `c${index}`, header: extra.label })),
  ];
  const rows: DataTableRow[] = slugs.map((slug, index) => {
    const spell = bySlug.get(slug);
    return {
      key: slug,
      cells: [
        <Link key={slug} href={`/${locale}/library/${CONTENT_SUBDIRS.spells}/${slug}`}>
          {spell?.title ?? humanize(slug)}
        </Link>,
        cell(spell === undefined ? undefined : spell.level === 0 ? t('cantrip') : spell.level),
        cell(spell?.castingTimeRaw),
        cell(spell?.range),
        cell(spell?.duration),
        ...extras.map((extra) => cell(extra.cells[index])),
      ],
    };
  });
  return <DataTable columns={columns} rows={rows} dataAttributes={{ spellList: String(slugs.length) }} />;
};

SpellList.displayName = 'SpellList';

export default SpellList;
