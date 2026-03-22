'use client';

import { DEFAULT_SPELL_LEVEL_LABELS } from '@/lib/enums/tableConstants';
import { useSpellSources } from '@/lib/hooks/data/useSpellSources';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import MetadataTable, {
  type ColumnConfig,
  type MetadataRow,
} from '../metadataTables/metadataTable';
import styles from './spellTable.module.scss';
import { SpellTableSkeleton } from './spellTableSkeleton';

/**
 * @interface SpellData
 * @description Spell metadata structure from API or direct data source
 * @property {string} slug - URL-safe identifier
 * @property {string} title - Display name of the spell
 * @property {number} level - Spell level (0 = cantrip, 1-12 = spell levels)
 * @property {string} school - School of magic (e.g., "Evocation", "Abjuration")
 * @property {string[]} castingTime - Parsed casting time actions (e.g., ["action", "reaction"])
 * @property {string} castingTimeRaw - Raw casting time text from spell description
 * @property {string} range - Spell range (e.g., "120 feet", "Self", "Touch")
 * @property {string} duration - Spell duration (e.g., "Instantaneous", "1 minute")
 * @property {boolean} verbal - Whether spell requires verbal component
 * @property {boolean} somatic - Whether spell requires somatic component
 * @property {boolean} material - Whether spell requires material component
 * @property {string} [materialDescription] - Description of material component if required
 * @property {boolean} concentration - Whether spell requires concentration
 */
interface SpellData {
  slug: string;
  title: string;
  level: number;
  school: string;
  castingTime: string[];
  castingTimeRaw: string;
  range: string;
  duration: string;
  verbal: boolean;
  somatic: boolean;
  material: boolean;
  materialDescription?: string;
  concentration: boolean;
  [key: string]: unknown;
}

/**
 * @interface SpellTablesProps
 * @description Props for SpellTable component
 * @property {(string | SpellData[])[]} sources - Array of API endpoint URLs or direct spell data arrays. API endpoints are fetched with locale parameter appended.
 * @property {string} [locale="en"] - Locale for API requests and display
 * @property {number[]} [levels=[0,1,2,3,4,5,6,7,8,9,10,11,12]] - Spell levels to display as tabs
 * @property {Record<number, string>} [levelLabels] - Custom labels for spell level tabs
 * @property {string} [basePath="spells"] - Base path for spell detail links
 * @property {boolean} [showAllTab=false] - Whether to show an "All" tab displaying all spell levels
 * @property {string[]} [spells] - Optional array of spell slugs to filter by. If provided, only spells with matching slugs are returned.
 * @property {string} [listSource] - Vocation/class name to fetch spells from spell_lists (pg backend only). Takes priority over spells prop.
 */
interface SpellTablesProps {
  sources: (string | SpellData[])[];
  locale?: string;
  levels?: number[];
  levelLabels?: Record<number, string>;
  basePath?: string;
  showAllTab?: boolean;
  spells?: string[];
  listSource?: string;
}

/**
 * Tabbed spell table component with filtering, sorting, and search.
 * Fetches spell data from API endpoints or accepts direct data arrays.
 * Filters spells by level when tab is selected (efficient single-table approach).
 *
 * @component
 * @param {SpellTablesProps} props - Component props
 * @param {(string | SpellData[])[]} props.sources - Array of API endpoint URLs or direct spell data arrays
 * @param {string} [props.locale="en"] - Locale for API requests and display
 * @param {number[]} [props.levels=[0,1,2,3,4,5,6,7,8,9,10,11,12]] - Spell levels to display as tabs
 * @param {Record<number, string>} [props.levelLabels] - Custom labels for spell level tabs
 * @param {string} [props.basePath="spells"] - Base path for spell detail links
 * @param {boolean} [props.showAllTab=false] - Whether to show an "All" tab displaying all spell levels
 * @returns {JSX.Element} Rendered spell table with tabs
 *
 * @example
 * // Basic usage with API endpoint
 * <SpellTable sources={['/api/spells']} showAllTab={true} />
 *
 * @example
 * // With custom levels and labels
 * <SpellTable
 *   sources={['/api/spells']}
 *   levels={[0, 1, 2, 3]}
 *   levelLabels={{ 0: "Cantrips", 1: "First", 2: "Second", 3: "Third" }}
 * />
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
  const tColumns = useTranslations('tables.spells.columns');
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

  const filteredSpells =
    activeTab === 'all'
      ? spellData
      : spellData.filter((spell) => spell.level === activeTab);

  const columns: ColumnConfig[] = [
    {
      key: 'title',
      label: tColumns('spellName'),
      getValue: (row: MetadataRow) => row.title,
      sortable: true,
    },
    {
      key: 'school',
      label: tColumns('school'),
      getValue: (row: MetadataRow) => row.school ?? '—',
      render: (value: string) => <em>{value}</em>,
      sortable: true,
    },
    {
      key: 'castingTime',
      label: tColumns('castingTime'),
      getValue: (row: MetadataRow) => row.castingTime ?? [],
      render: (value: string[]) => {
        const isRitual = value && value.includes('ritual');
        const displayTimes = value
          .filter((time: string) => time !== 'ritual')
          .map((time: string) =>
            time
              .replace(/-/g, ' ')
              .replace(/\b\w/g, (l: string) => l.toUpperCase()),
          )
          .join(', ');
        return isRitual ? `${displayTimes} (R)` : displayTimes;
      },
      sortable: true,
    },
    {
      key: 'range',
      label: tColumns('range'),
      getValue: (row: MetadataRow) => row.range ?? '—',
      sortable: true,
    },
    {
      key: 'duration',
      label: tColumns('duration'),
      getValue: (row: MetadataRow) => {
        const duration = row.duration ?? '—';
        return row.concentration ? `Concentration, ${duration}` : duration;
      },
      sortable: true,
    },
    {
      key: 'components',
      label: tColumns('components'),
      getValue: (row: MetadataRow) => {
        const components = [];
        if (row.verbal) components.push('V');
        if (row.somatic) components.push('S');
        if (row.material) components.push('M');
        return components.join(', ') || '—';
      },
      sortable: false,
    },
  ];

  if (loading) {
    return <SpellTableSkeleton rows={20} tabCount={displayLevels.length} />;
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
        {filteredSpells.length > 0 ? (
          <MetadataTable
            data={filteredSpells}
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

export default SpellTable;
