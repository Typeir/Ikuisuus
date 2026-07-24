/**
 * @fileoverview Boon Picker Component
 * @description Fetches the bloodline's boon list from `/api/bloodlines` and renders
 * selectable boon cards with BP cost badges. An advisory budget meter shows total
 * BP spent vs the bloodline's boon budget. Selected boons are highlighted with the
 * accent gradient.
 *
 * When a boon is toggled on, the full prose body is fetched from the
 * `/api/content-shards/bloodlines/[slug]` endpoint — the server resolves line
 * anchors and heading search internally so this component never needs to know
 * the MDX file structure.
 *
 * @module lib/components/characterSheet/boonPicker
 * @version 1.2.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { Skeleton, SkeletonGroup } from '@/lib/components/skeleton/skeleton';
import type { BloodlineBoon } from '@/lib/db/content/schemas/bloodlineMetadata.d';
import { fetcher } from '@/lib/fetch/fetcher';
import { useBloodlines } from '@/lib/hooks/data/useBloodlines';
import type { CharacterShard } from '@/lib/types/character';
import { computeBpSpent } from '@/modules/character-builder/lib/utils/shardExtractor';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { useSWRConfig } from 'swr';
import styles from '../CharacterSheet/characterSheetWidgets.module.scss';
import { applySubOptionSelection } from './boonSelection';
import { BoonSubOptions } from './boonSubOptions';
import { FeatureCard } from './featureCard';
import pickerStyles from './pickerControls.module.scss';

/**
 * Props for the BoonPicker component.
 *
 * @interface BoonPickerProps
 * @property {string} bloodlineSlug - Slug of the character's bloodline
 * @property {CharacterShard[]} selectedBoons - Currently selected boon shards
 * @property {number} boonBudget - Total boon point budget from the bloodline
 * @property {(boons: CharacterShard[]) => void} onToggle - Callback when a boon is toggled
 * @property {boolean} [readOnly] - When true, items are visible but not interactive
 * @property {string} [locale] - Content locale; component uses `useLocale()` internally and this prop is accepted for caller convenience
 */
export interface BoonPickerProps {
  bloodlineSlug: string;
  selectedBoons: CharacterShard[];
  boonBudget: number;
  onToggle: (boons: CharacterShard[]) => void;
  readOnly?: boolean;
  locale?: string;
}

/**
 * Boon picker panel. Fetches available boons for the bloodline, renders them as
 * toggle cards with tag-based tooltips, and shows an advisory budget meter.
 *
 * @component
 * @param {BoonPickerProps} props - Component props
 * @returns {JSX.Element} Rendered boon picker
 */
export const BoonPicker: React.FC<BoonPickerProps> = ({
  bloodlineSlug,
  selectedBoons,
  boonBudget,
  onToggle,
  readOnly = false,
}) => {
  const locale = useLocale();
  const {
    bloodlines,
    isLoading: loading,
    error: fetchError,
  } = useBloodlines({ locale });
  const error = fetchError?.message ?? null;
  const t = useTranslations('characterSheet');
  const tCommon = useTranslations('common');
  const { cache, mutate } = useSWRConfig();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBoons, setExpandedBoons] = useState<Set<string>>(
    () => new Set(),
  );

  const boons: BloodlineBoon[] = useMemo(
    () => bloodlines.find((b) => b.slug === bloodlineSlug)?.boons ?? [],
    [bloodlines, bloodlineSlug],
  );

  const toggleExpanded = useCallback((name: string) => {
    setExpandedBoons((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const filteredBoons = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return boons;
    return boons.filter((b) => b.name.toLowerCase().includes(q));
  }, [boons, searchQuery]);

  const displayedBoons = useMemo(
    () =>
      readOnly
        ? filteredBoons.filter((b) =>
            selectedBoons.some((s) => s.heading === b.name),
          )
        : filteredBoons,
    [readOnly, filteredBoons, selectedBoons],
  );

  const bpSpent = computeBpSpent(selectedBoons);
  const bpRemaining = boonBudget - bpSpent;

  const isBoonSelected = (name: string) =>
    selectedBoons.some((s) => s.heading === name);

  const handleToggle = async (boon: BloodlineBoon) => {
    if (isBoonSelected(boon.name)) {
      onToggle(selectedBoons.filter((s) => s.heading !== boon.name));
      return;
    }

    if (boon.subOptions !== undefined && boon.subOptions.length > 0) {
      return;
    }

    const url = `/api/content-shards/bloodlines/${bloodlineSlug}?keys[]=${encodeURIComponent(boon.name)}&locale=${locale}`;

    type BoonShardResponse = { shards: Record<string, string> };
    let cachedText: string | undefined;
    const cached = cache.get(url)?.data as BoonShardResponse | undefined;
    if (cached) {
      cachedText = cached.shards[boon.name];
    } else {
      try {
        const data = await mutate<BoonShardResponse>(
          url,
          fetcher<BoonShardResponse>(url),
          { revalidate: false, populateCache: true },
        );
        cachedText = data?.shards[boon.name];
      } catch {
        /** cachedText stays undefined; ShardDisplay will lazy-fetch on expand */
      }
    }

    const shard: CharacterShard = {
      id: `${bloodlineSlug}::${boon.name}`,
      sourceFile: `character-creation/bloodlines/${bloodlineSlug}.bloodline.mdx`,
      heading: boon.name,
      category: 'boon',
      bpCost: boon.bpValue,
      cachedText,
    };
    onToggle([...selectedBoons, shard]);
  };

  const handleSelectSubOption = (boon: BloodlineBoon, optionName: string) => {
    if (readOnly) return;
    onToggle(
      applySubOptionSelection(selectedBoons, boon, optionName, bloodlineSlug),
    );
  };

  return (
    <div className={styles.boonPicker}>
      {!readOnly && (
        <div
          className={styles.boonBudgetMeter}
          aria-label={t('ariaBoonBudget')}>
          <span className={styles.boonBudgetLabel}>
            {t('bpFormat', { spent: bpSpent, total: boonBudget })}
          </span>
          <div className={styles.boonBudgetBar}>
            <div
              className={`${styles.boonBudgetFill} ${bpRemaining < 0 ? styles.boonBudgetOver : ''}`}
              style={{
                width: `${Math.min(100, (bpSpent / Math.max(boonBudget, 1)) * 100)}%`,
              }}
            />
          </div>
          {bpRemaining < 0 && (
            <span className={styles.boonBudgetWarning}>
              {t('bpOverBudget', { amount: Math.abs(bpRemaining) })}
            </span>
          )}
        </div>
      )}

      {loading && (
        <SkeletonGroup>
          <Skeleton variant='button' width='100%' />
          <Skeleton variant='button' width='100%' />
          <Skeleton variant='button' width='100%' />
          <Skeleton variant='button' width='100%' />
        </SkeletonGroup>
      )}
      {error && <p className={styles.boonError}>{error}</p>}

      {!loading && !error && (
        <>
          {!readOnly && (
            <input
              type='search'
              className={pickerStyles.pickerSearch}
              placeholder={tCommon('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label={tCommon('searchPlaceholder')}
            />
          )}
          <div className={pickerStyles.pickerScroll}>
            <ul
              className={styles.boonList}
              aria-label={t('ariaAvailableBoons')}>
              {displayedBoons.map((boon) => {
                const selected = isBoonSelected(boon.name);
                const isExpanded = expandedBoons.has(boon.name);
                const bodyId = `boon-body-${bloodlineSlug}-${boon.name.replace(/\s+/g, '-')}`;
                const cachedShard = selectedBoons.find(
                  (s) => s.heading === boon.name,
                );
                const hasSubOptions =
                  boon.subOptions !== undefined && boon.subOptions.length > 0;
                const resolvedCost = cachedShard?.bpCost;
                const badgeText =
                  boon.bpValue !== undefined
                    ? `${boon.bpValue} ${t('bpUnit')}`
                    : hasSubOptions && resolvedCost !== undefined
                      ? `${resolvedCost} ${t('bpUnit')}`
                      : boon.bpLabel;
                const expandLabel = isExpanded
                  ? t('shardCollapseAria', { name: boon.name })
                  : t('shardExpandAria', { name: boon.name });
                const subOptionSlot = hasSubOptions ? (
                  <BoonSubOptions
                    boonName={boon.name}
                    options={boon.subOptions ?? []}
                    mode={boon.subOptionMode ?? 'choose-one'}
                    selected={cachedShard?.selectedSubOptions ?? []}
                    readOnly={readOnly}
                    bpUnitLabel={t('bpUnit')}
                    onChange={(optionName) =>
                      handleSelectSubOption(boon, optionName)
                    }
                  />
                ) : undefined;
                return (
                  <FeatureCard
                    key={boon.name}
                    label={boon.name}
                    badge={badgeText}
                    selected={selected}
                    expanded={isExpanded}
                    readOnly={readOnly}
                    onToggle={() => handleToggle(boon)}
                    onExpand={() => toggleExpanded(boon.name)}
                    contentType='bloodlines'
                    contentSlug={bloodlineSlug}
                    contentKey={boon.name}
                    cachedText={cachedShard?.cachedText}
                    bodyId={bodyId}
                    expandLabel={expandLabel}
                    subOptions={subOptionSlot}
                  />
                );
              })}
              {displayedBoons.length === 0 && (
                <li className={styles.boonEmpty}>{t('noBoonsAvailable')}</li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};
