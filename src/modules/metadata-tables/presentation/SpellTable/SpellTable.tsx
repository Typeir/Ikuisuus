/**
 * @fileoverview Tabbed spell table presentation component.
 * @module src/modules/metadata-tables/presentation/SpellTable/SpellTable
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */
'use client';

import MetadataTable from '@/lib/components/mdx/metadataTables/metadataTable';
import { GradientTabs } from '@/lib/components/ui/gradientTabs';
import { DEFAULT_SPELL_LEVEL_LABELS } from '@/modules/metadata-tables/domain/constants';
import { useSpellSources } from '@/modules/metadata-tables/application/hooks/useSpellSources';
import type { SpellTablesProps } from '@/modules/metadata-tables/domain/types';
import { SpellTableSkeleton } from '@/modules/metadata-tables/presentation/SpellTableSkeleton';
import { useSpellColumns } from '@/modules/metadata-tables/presentation/useSpellColumns';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import styles from './SpellTable.module.scss';

/**
 * Tabbed spell table. Fetches spell data from API endpoints or inline arrays and
 * renders one level-tab per spell level. For the full library page with school,
 * concentration, and setting filters, use FilteredSpellTable.
 *
 * @component
 * @param {SpellTablesProps} props
 * @param {(string | SpellData[])[]} props.sources - API endpoint URLs or inline spell data
 * @param {string} [props.locale="en"] - Locale for API requests and display
 * @param {number[]} [props.levels] - Spell levels to display as tabs
 * @param {Record<number, string>} [props.levelLabels] - Custom labels for level tabs
 * @param {string} [props.basePath="spells"] - Base path for spell detail links
 * @param {boolean} [props.showAllTab=false] - Whether to prepend an "All" tab
 * @param {string[]} [props.spells] - Optional slug allow-list
 * @param {string} [props.listSource] - Vocation name for pg spell_lists backend
 * @returns {JSX.Element} Rendered tabbed spell table
 */
const SpellTable: React.FC<SpellTablesProps> = ({
  sources,
  locale = 'en',
  levels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  levelLabels = DEFAULT_SPELL_LEVEL_LABELS,
  basePath = 'spells',
  showAllTab = false,
  spells,
  listSource,
}) => {
  const t = useTranslations('tables.spells');
  const tCommon = useTranslations('common');
  const displayLevels: (number | 'all')[] = showAllTab
    ? ['all', ...levels]
    : levels;
  const allLevelLabels: Record<number, string> &
    Partial<Record<'all', string>> = showAllTab
    ? { all: t('levelLabels.all'), ...levelLabels }
    : levelLabels;
  const [activeTab, setActiveTab] = useState<number | 'all'>(
    showAllTab ? 'all' : levels[0],
  );
  const { spellData, loading, error } = useSpellSources(
    sources,
    locale,
    spells,
    listSource,
  );
  const columns = useSpellColumns();

  const visibleSpells =
    activeTab === 'all'
      ? spellData
      : spellData.filter((spell) => spell.level === activeTab);

  if (loading) {
    return <SpellTableSkeleton rows={20} tabCount={displayLevels.length} />;
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>
          {tCommon('error')}: {error}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.spellTables}>
      <GradientTabs
        tabs={displayLevels.map((level) => ({
          value: String(level),
          label: allLevelLabels[level] || `Level ${level}`,
        }))}
        activeTab={String(activeTab)}
        onChange={(val) => setActiveTab(val === 'all' ? 'all' : Number(val))}>
        {visibleSpells.length > 0 ? (
          <MetadataTable
            data={visibleSpells}
            columns={columns}
            getRowSlug={(row) => `${basePath}/${row.slug}`}
            searchKeys={[
              'title',
              'school',
              'castingTimeRaw',
              'duration',
              'range',
            ]}
            locale={locale}
            pageSize={100}
          />
        ) : (
          <p className={styles.noSpells}>{t('noSpells')}</p>
        )}
      </GradientTabs>
    </div>
  );
};

export default SpellTable;
