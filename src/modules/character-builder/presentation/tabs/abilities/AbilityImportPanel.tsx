/**
 * @fileoverview Ability Import Panel
 * @description Segmented import panel for the Abilities tab. Sources:
 * Spells, Heirlooms, Trinkets, Feats. Each tab fetches metadata via SWR and
 * renders {@link MetadataTable} with source-specific columns. Rows render as
 * buttons (`onRowSelect`) that import the item as a `CharacterAbility` through
 * the abilities context.
 *
 * @module lib/components/characterSheet/tabs/abilities/AbilityImportPanel
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import MetadataTable, {
  type ColumnConfig,
  type MetadataRow,
} from '@/lib/components/mdx/metadataTables/metadataTable';
import { Skeleton, SkeletonGroup } from '@/lib/components/skeleton/skeleton';
import { ChevronScroll } from '@/lib/components/ui/chevronScroll';
import { Tooltip } from '@/lib/components/ui/tooltip';
import type { FeatMetadata } from '@/lib/db/content/schemas/featMetadata';
import type { HeirloomMetadata } from '@/lib/db/content/schemas/heirloomMetadata';
import type { SpellMetadata } from '@/lib/db/content/schemas/spellMetadata';
import type { TrinketMetadata } from '@/lib/db/content/schemas/trinketMetadata';
import { useFeats } from '@/lib/hooks/data/useFeats';
import { useHeirloomsForImport } from '@/lib/hooks/data/useHeirloomsForImport';
import { useSpellsForImport } from '@/lib/hooks/data/useSpellsForImport';
import { useTrinketsForImport } from '@/lib/hooks/data/useTrinketsForImport';
import { PipCheckbox } from '@/modules/character-builder/presentation/components/PipCheckbox';
import { usePagePreview } from '@/modules/character-builder/presentation/PagePreview/pagePreviewProvider';
import { DEFAULT_SPELL_LEVEL_LABELS } from '@/modules/metadata-tables/domain/constants';
import { BookOpen, ExternalLink } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import styles from './abilities.module.scss';
import { useAbilities } from './abilitiesContext';
import type { ImportTab } from './abilityImportTypes';
import { SOURCE_PATHS } from './abilityImportTypes';
import { mapImportToAbility } from './importAbilityMapper';
import { useImportColumns } from './useImportColumns';

/** Row properties searched per import tab, mirroring the library table views. */
const SEARCH_KEYS: Record<ImportTab, string[]> = {
  spells: ['title', 'school', 'castingTimeRaw', 'duration', 'range'],
  heirlooms: ['title', 'itemType'],
  trinkets: ['title', 'itemType', 'specialEffects', 'inflictsConditions'],
  feats: ['title', 'prerequisite', 'description'],
};

/**
 * Props for `AbilityImportPanel`.
 *
 * @interface AbilityImportPanelProps
 */
interface AbilityImportPanelProps {
  /** Whether the panel is collapsed. */
  collapsed?: boolean;
  /** Callback to toggle collapse state. */
  onToggleCollapse?: () => void;
}

/**
 * Segmented import panel for spells, heirlooms, trinkets, and feats.
 *
 * @component
 * @param {AbilityImportPanelProps} props - Component props
 * @param {boolean} [props.collapsed=false] - Whether the panel is collapsed.
 * @param {() => void} [props.onToggleCollapse] - Callback to toggle collapse state.
 * @returns {JSX.Element} Rendered import panel
 */
export const AbilityImportPanel: React.FC<AbilityImportPanelProps> = ({
  collapsed = false,
  onToggleCollapse,
}) => {
  const t = useTranslations('characterSheet');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const preview = usePagePreview();
  const { mutators, vocationSources } = useAbilities();
  const { importAbility } = mutators;
  const [activeTab, setActiveTab] = useState<ImportTab>('spells');
  const [spellLevel, setSpellLevel] = useState<number | 'all'>('all');
  const [showAllSpells, setShowAllSpells] = useState(false);

  const {
    spells,
    isLoading: spellsLoading,
    error: spellsError,
  } = useSpellsForImport({
    locale,
    enabled: activeTab === 'spells',
    listSources: showAllSpells ? undefined : vocationSources,
  });
  const {
    heirlooms,
    isLoading: heirloomsLoading,
    error: heirloomsError,
  } = useHeirloomsForImport({ locale, enabled: activeTab === 'heirlooms' });
  const {
    trinkets,
    isLoading: trinketsLoading,
    error: trinketsError,
  } = useTrinketsForImport({ locale, enabled: activeTab === 'trinkets' });
  const {
    feats: featItems,
    isLoading: featsLoading,
    error: featsError,
  } = useFeats({ locale, enabled: activeTab === 'feats' });

  const columns = useImportColumns();

  const tabConfig: Record<
    ImportTab,
    { data: MetadataRow[]; columns: ColumnConfig[]; loading: boolean; error: string | null }
  > = {
    spells: {
      data: spells as unknown as MetadataRow[],
      columns: columns.spells,
      loading: spellsLoading,
      error: spellsError?.message ?? null,
    },
    heirlooms: {
      data: heirlooms as unknown as MetadataRow[],
      columns: columns.heirlooms,
      loading: heirloomsLoading,
      error: heirloomsError?.message ?? null,
    },
    trinkets: {
      data: trinkets as unknown as MetadataRow[],
      columns: columns.trinkets,
      loading: trinketsLoading,
      error: trinketsError?.message ?? null,
    },
    feats: {
      data: featItems as unknown as MetadataRow[],
      columns: columns.feats,
      loading: featsLoading,
      error: featsError?.message ?? null,
    },
  };
  const current = tabConfig[activeTab];

  const spellLevels = useMemo(() => {
    const present = new Set<number>();
    for (const spell of spells) {
      const level = (spell as SpellMetadata).level;
      if (typeof level === 'number') present.add(level);
    }
    return [...present].sort((a, b) => a - b);
  }, [spells]);

  const tableData = useMemo(() => {
    if (activeTab !== 'spells' || spellLevel === 'all') return current.data;
    return current.data.filter((row) => row.level === spellLevel);
  }, [activeTab, spellLevel, current.data]);

  const handleImport = useCallback(
    (row: MetadataRow) => {
      importAbility(
        mapImportToAbility(
          row as SpellMetadata | HeirloomMetadata | TrinketMetadata | FeatMetadata,
          activeTab,
        ),
      );
    },
    [activeTab, importAbility],
  );

  const importTabs: { value: ImportTab; label: string }[] = [
    { value: 'spells', label: t('abilityImportSpells') },
    { value: 'heirlooms', label: t('abilityImportHeirlooms') },
    { value: 'trinkets', label: t('abilityImportTrinkets') },
    { value: 'feats', label: t('abilityImportFeats') },
  ];

  return (
    <aside className={styles.importPanel} aria-label={t('abilityImport')}>
      <div className={styles.importHeader}>
        <h3 className={styles.importTitle}>{t('abilityImport')}</h3>
        <Tooltip
          content={t('abilityImportSourceTooltip', { tab: activeTab })}
          placement='top'
          showDelay={250}
          showClickIcon={false}>
          <a
            href={`/${locale}/library/${SOURCE_PATHS[activeTab]}`}
            className={styles.importSourceLink}
            aria-label={t('abilityImportSourceAria', { tab: activeTab })}>
            <ExternalLink size={14} />
          </a>
        </Tooltip>
      </div>

      {/* Segmented tabs */}
      <div className={styles.importTabs} role='tablist'>
        {importTabs.map((tab) => (
          <button
            key={tab.value}
            type='button'
            role='tab'
            className={styles.importTab}
            aria-selected={activeTab === tab.value}
            onClick={() => setActiveTab(tab.value)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Show-all-spells scope toggle — a GM may grant any spell, so casters
          can look past their vocation list. Hidden when the list is already
          unscoped (non-casters see every spell by default). */}
      {activeTab === 'spells' && !!vocationSources?.length && (
        <div className={styles.spellScopeRow}>
          <PipCheckbox
            checked={showAllSpells}
            onChange={setShowAllSpells}
            label={t('abilityImportShowAllSpells')}
          />
        </div>
      )}

      {/* Spell level sub-tabs — chevron-scrollable strip */}
      {activeTab === 'spells' && spellLevels.length > 0 && (
        <ChevronScroll
          className={styles.importTabs}
          ariaLabel={t('abilityImportSpellLevel')}>
          <button
            type='button'
            role='tab'
            className={styles.importTab}
            aria-selected={spellLevel === 'all'}
            onClick={() => setSpellLevel('all')}>
            {tCommon('all')}
          </button>
          {spellLevels.map((level) => (
            <button
              key={level}
              type='button'
              role='tab'
              className={styles.importTab}
              aria-selected={spellLevel === level}
              onClick={() => setSpellLevel(level)}>
              {(DEFAULT_SPELL_LEVEL_LABELS[level] ?? String(level)).replace(
                ' Level',
                '',
              )}
            </button>
          ))}
        </ChevronScroll>
      )}

      {/* Item table (scrolls vertically within the height-capped panel) */}
      <div className={styles.importScroll}>
        {current.loading && (
        <SkeletonGroup>
          <Skeleton variant='text' width='85%' />
          <Skeleton variant='text' width='70%' />
          <Skeleton variant='text' width='90%' />
          <Skeleton variant='text' width='60%' />
          <Skeleton variant='text' width='80%' />
          <Skeleton variant='text' width='72%' />
        </SkeletonGroup>
      )}
      {current.error && <p className={styles.importStatus}>{current.error}</p>}
      {!current.loading && !current.error && tableData.length > 0 && (
        <MetadataTable
          data={tableData}
          columns={current.columns}
          onRowSelect={handleImport}
          rowAction={{
            label: t('abilityImportConsultSource'),
            icon: <BookOpen size={14} />,
            onSelect: (row) =>
              preview.open({
                kind: activeTab,
                slug: String(row.slug),
                title: String(row.title ?? row.slug),
              }),
          }}
          searchKeys={SEARCH_KEYS[activeTab]}
          size='s'
          locale={locale}
          pageSize={25}
        />
      )}
        {!current.loading && !current.error && tableData.length === 0 && (
          <p className={styles.importStatus}>{t('noFeaturesSelected')}</p>
        )}
      </div>
    </aside>
  );
};
