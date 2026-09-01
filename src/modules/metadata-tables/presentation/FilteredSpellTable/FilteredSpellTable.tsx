/**
 * @fileoverview Spell table with concentration and Damocles filters.
 *
 * @module src/modules/metadata-tables/presentation/FilteredSpellTable/FilteredSpellTable
 * @author Typeir
 * @version 2.0.0
 * @since 2.0.0
 */
'use client';

import MetadataTable from '@/lib/components/mdx/metadataTables/metadataTable';
import type { FilterSelectOption } from '@/lib/components/ui';
import gradientTabStyles from '@/lib/components/ui/gradientTabs/gradientTabs.module.scss';
import { DEFAULT_SPELL_LEVEL_LABELS } from '@/modules/metadata-tables/domain/constants';
import { useSpellSources } from '@/modules/metadata-tables/application/hooks/useSpellSources';
import { useSpellTableFilters } from '@/modules/metadata-tables/application/hooks/useSpellTableFilters';
import type { SpellTablesProps } from '@/modules/metadata-tables/domain/types';
import { FilteredSpellTableControls } from '@/modules/metadata-tables/presentation/FilteredSpellTable/FilteredSpellTableControls';
import styles from '@/modules/metadata-tables/presentation/SpellTable/SpellTable.module.scss';
import { SpellTableSkeleton } from '@/modules/metadata-tables/presentation/SpellTableSkeleton';
import { useSpellColumns } from '@/modules/metadata-tables/presentation/useSpellColumns';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

/**
 * Spell table with external filter controls. Damocles and concentration filters.
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
 * @returns {JSX.Element} Rendered filtered spell table
 */
const FilteredSpellTable: React.FC<SpellTablesProps> = ({
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
  const tFilters = useTranslations('tables.spells.filters');
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

  const { state, setters, expressions } = useSpellTableFilters();

  const { spellData, loading, refetching, error } = useSpellSources(
    sources,
    locale,
    spells,
    listSource,
    expressions,
  );
  const columns = useSpellColumns();

  const concentrationOptions = useMemo<FilterSelectOption[]>(
    () => [
      { value: 'yes', label: tCommon('yes') },
      { value: 'no', label: tCommon('no') },
    ],
    [tCommon],
  );

  const visibleSpells =
    activeTab === 'all'
      ? spellData
      : spellData.filter((s) => s.level === activeTab);

  if (loading) {
    return (
      <SpellTableSkeleton
        rows={20}
        tabCount={displayLevels.length}
        showFilterSkeleton
      />
    );
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
      <FilteredSpellTableControls
        state={state}
        setters={setters}
        concentrationOptions={concentrationOptions}
        tFilters={tFilters}
      />

      <div className={gradientTabStyles.gradientContainer}>
        <div className={gradientTabStyles.tabNavWrapper}>
          <div className={gradientTabStyles.tabNav}>
            <div className={gradientTabStyles.tabList}>
              {displayLevels.map((level) => (
                <div
                  key={level}
                  className={`${gradientTabStyles.tab} ${
                    activeTab === level ? gradientTabStyles.active : ''
                  }`}>
                  <button type='button' onClick={() => setActiveTab(level)}>
                    {allLevelLabels[level] || `Level ${level}`}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className={`${gradientTabStyles.tabContent}${
          refetching ? ` ${styles.refetchingOverlay}` : ''
        }`}>
        {visibleSpells.length > 0 ? (
          <MetadataTable
            searchScope='spells'
            data={visibleSpells}
            columns={columns}
            getRowSlug={(row) => `${basePath}/${row.slug}`}
            searchKeys={[
              'title',
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
      </div>
    </div>
  );
};

export default FilteredSpellTable;
