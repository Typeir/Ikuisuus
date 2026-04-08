/**
 * @fileoverview Spell table with school, concentration, and Damocles-setting filters.
 * Intended for use on the main spell library page.
 * @module src/lib/components/mdx/spellTable/filteredSpellTable
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */
'use client';

import { FilterSelect, type FilterSelectOption } from '@/lib/components/ui';
import { DEFAULT_SPELL_LEVEL_LABELS } from '@/lib/enums/tableConstants';
import { useSpellSources } from '@/lib/hooks/data/useSpellSources';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import MetadataTable from '../metadataTables/metadataTable';
import styles from './spellTable.module.scss';
import type { SpellTablesProps } from './spellTable.types';
import { SpellTableSkeleton } from './spellTableSkeleton';
import { useSpellColumns } from './useSpellColumns';

/**
 * Spell table with external filter controls rendered above the level-tab strip.
 * Provides a "Damocles Only" toggle (hides SRD spells where `file === "external"`),
 * a school select, and a concentration select. All filter state is local.
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
  const [damoclesOnly, setDamoclesOnly] = useState(false);
  const [schoolFilter, setSchoolFilter] = useState('');
  const [concentrationFilter, setConcentrationFilter] = useState('');

  const { spellData, loading, error } = useSpellSources(
    sources,
    locale,
    spells,
    listSource,
  );
  const columns = useSpellColumns();

  const availableSchools = useMemo(
    () =>
      (
        Array.from(new Set(spellData.map((s) => s.school))).filter(
          Boolean,
        ) as string[]
      ).sort(),
    [spellData],
  );

  const schoolOptions = useMemo<FilterSelectOption[]>(
    () => availableSchools.map((school) => ({ value: school, label: school })),
    [availableSchools],
  );

  const concentrationOptions = useMemo<FilterSelectOption[]>(
    () => [
      { value: 'yes', label: tFilters('yes') },
      { value: 'no', label: tFilters('no') },
    ],
    [tFilters],
  );

  const preFiltered = useMemo(() => {
    let result = spellData;
    if (damoclesOnly) result = result.filter((s) => s.file !== 'external');
    if (schoolFilter) result = result.filter((s) => s.school === schoolFilter);
    if (concentrationFilter === 'yes')
      result = result.filter((s) => s.concentration);
    if (concentrationFilter === 'no')
      result = result.filter((s) => !s.concentration);
    return result;
  }, [spellData, damoclesOnly, schoolFilter, concentrationFilter]);

  const visibleSpells =
    activeTab === 'all'
      ? preFiltered
      : preFiltered.filter((s) => s.level === activeTab);

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
          {t('error')}: {error}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.spellTables}>
      <div className={styles.filterControls}>
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label
              className={styles.filterLabel}
              htmlFor='spell-damocles-filter'>
              {tFilters('damoclesOnly')}
            </label>
            <div className={styles.filterCheckboxRow}>
              <input
                id='spell-damocles-filter'
                className={styles.filterCheckbox}
                type='checkbox'
                checked={damoclesOnly}
                onChange={(e) => setDamoclesOnly(e.target.checked)}
              />
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor='spell-school-filter'>
              {tFilters('school')}
            </label>
            <FilterSelect
              id='spell-school-filter'
              value={schoolFilter}
              options={schoolOptions}
              onChange={setSchoolFilter}
              allLabel={tFilters('allSchools')}
              placeholder={tFilters('allSchools')}
              ariaLabel={tFilters('school')}
              size='sm'
            />
          </div>

          <div className={styles.filterGroup}>
            <label
              className={styles.filterLabel}
              htmlFor='spell-concentration-filter'>
              {tFilters('concentration')}
            </label>
            <FilterSelect
              id='spell-concentration-filter'
              value={concentrationFilter}
              options={concentrationOptions}
              onChange={setConcentrationFilter}
              allLabel={tFilters('all')}
              placeholder={tFilters('all')}
              ariaLabel={tFilters('concentration')}
              size='sm'
            />
          </div>
        </div>
      </div>

      <div className={styles.gradientContainer}>
        <div className={styles.tabNavWrapper}>
          <div className={styles.tabNav}>
            <div className={styles.tabList}>
              {displayLevels.map((level) => (
                <div
                  key={level}
                  className={`${styles.tab} ${
                    activeTab === level ? styles.active : ''
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

      <div className={styles.tabContent}>
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
      </div>
    </div>
  );
};

export default FilteredSpellTable;
