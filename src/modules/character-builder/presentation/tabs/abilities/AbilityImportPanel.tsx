/**
 * @fileoverview Ability Import Panel
 * @description Segmented import panel for the Abilities tab. Sources:
 * Spells, Heirlooms, Trinkets, Feats. Each tab fetches metadata via SWR
 * and renders a searchable list. Clicking an item imports it as a
 * `CharacterAbility` via the abilities context.
 *
 * @module lib/components/characterSheet/tabs/abilities/AbilityImportPanel
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { Skeleton, SkeletonGroup } from '@/lib/components/skeleton/skeleton';
import { Tooltip } from '@/lib/components/ui/tooltip';
import type { FeatMetadata } from '@/lib/db/content/schemas/featMetadata';
import type { HeirloomMetadata } from '@/lib/db/content/schemas/heirloomMetadata';
import type { SpellMetadata } from '@/lib/db/content/schemas/spellMetadata';
import type { TrinketMetadata } from '@/lib/db/content/schemas/trinketMetadata';
import { useFeats } from '@/lib/hooks/data/useFeats';
import { useHeirloomsForImport } from '@/lib/hooks/data/useHeirloomsForImport';
import { useSpellsForImport } from '@/lib/hooks/data/useSpellsForImport';
import { useTrinketsForImport } from '@/lib/hooks/data/useTrinketsForImport';
import { ExternalLink } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import styles from './abilities.module.scss';
import { useAbilities } from './abilitiesContext';
import type { ImportTab } from './abilityImportTypes';
import { SOURCE_PATHS } from './abilityImportTypes';
import { mapImportToAbility } from './importAbilityMapper';
import { VirtualizedImportList } from './VirtualizedImportList';

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
 * @returns {JSX.Element} Rendered import panel
 */
export const AbilityImportPanel: React.FC<AbilityImportPanelProps> = ({
  collapsed = false,
  onToggleCollapse,
}) => {
  const t = useTranslations('characterSheet');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const { mutators, vocationSources } = useAbilities();
  const { importAbility } = mutators;
  const [activeTab, setActiveTab] = useState<ImportTab>('spells');
  const [search, setSearch] = useState('');

  const {
    spells,
    isLoading: spellsLoading,
    error: spellsError,
  } = useSpellsForImport({
    locale,
    enabled: activeTab === 'spells',
    listSources: vocationSources,
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

  const loadingMap: Record<ImportTab, boolean> = {
    spells: spellsLoading,
    heirlooms: heirloomsLoading,
    trinkets: trinketsLoading,
    feats: featsLoading,
  };
  const errorMap: Record<ImportTab, string | null> = {
    spells: spellsError?.message ?? null,
    heirlooms: heirloomsError?.message ?? null,
    trinkets: trinketsError?.message ?? null,
    feats: featsError?.message ?? null,
  };
  const currentLoading = loadingMap[activeTab];
  const currentError = errorMap[activeTab];

  const filteredItems = useMemo(() => {
    const itemsMap: Record<ImportTab, Array<{ title: string; slug: string }>> = {
      spells,
      heirlooms,
      trinkets,
      feats: featItems,
    };
    const q = search.trim().toLowerCase();
    const items = itemsMap[activeTab];
    if (!q) return items;
    return items.filter((item) => item.title.toLowerCase().includes(q));
  }, [activeTab, spells, heirlooms, trinkets, featItems, search]);

  const handleImport = useCallback(
    (
      item: SpellMetadata | HeirloomMetadata | TrinketMetadata | FeatMetadata,
    ) => {
      importAbility(mapImportToAbility(item, activeTab));
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

      {/* Search + Source Link */}
      <div className={styles.importSearchRow}>
        <input
          type='search'
          className={styles.importSearch}
          placeholder={tCommon('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={tCommon('searchPlaceholder')}
        />
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

      {/* Item list */}
      {currentLoading && (
        <SkeletonGroup>
          <Skeleton variant='text' width='85%' />
          <Skeleton variant='text' width='70%' />
          <Skeleton variant='text' width='90%' />
          <Skeleton variant='text' width='60%' />
          <Skeleton variant='text' width='80%' />
          <Skeleton variant='text' width='72%' />
        </SkeletonGroup>
      )}
      {currentError && <p className={styles.importStatus}>{currentError}</p>}
      {!currentLoading && !currentError && filteredItems.length > 0 && (
        <VirtualizedImportList
          items={filteredItems as Array<{ title: string; slug: string }>}
          onImport={handleImport as any}
        />
      )}
      {!currentLoading && !currentError && filteredItems.length === 0 && (
        <p className={styles.importStatus}>{t('noFeaturesSelected')}</p>
      )}
    </aside>
  );
};
