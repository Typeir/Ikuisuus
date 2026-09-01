/**
 * @fileoverview Boon Picker Component
 * @description Fetches the bloodline's boon list from `/api/bloodlines` and renders
 * selectable boon cards with BP cost badges, a BP budget meter, and search
 * filtering. On toggle, fetches the boon's full body from
 * `/api/content-shards/bloodlines/[slug]`.
 *
 * @module modules/character-builder/presentation/builder/boonPicker
 * @version 1.2.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { Skeleton, SkeletonGroup } from '@/lib/components/skeleton/skeleton';
import type { BloodlineBoon } from '@/lib/db/content/schemas/bloodlineMetadata.d';
import { useBloodlines } from '@/lib/hooks/data/useBloodlines';
import type { CharacterShard } from '@/lib/types/character';
import { computeBpSpent } from '@/modules/character-builder/lib/utils/boonPoints';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { useSWRConfig } from 'swr';
import styles from '../CharacterSheet/characterSheetWidgets.module.scss';
import { applySubOptionSelection, buildBoonShard } from './boonSelection';
import { BoonSubOptions } from './boonSubOptions';
import { AspectFilterBar, useAspectFilter } from '../aspects/aspectFilterBar';
import { matchesAspects } from '../../lib/utils/aspectRollup';
import { shardIs } from '../../lib/utils/shardKey';
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
 * @property {string} [locale] - Unused; locale comes from `useLocale()`
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
 * Boon picker panel. Fetches available boons for the bloodline and renders them
 * as selectable cards with BP budget meter and search filtering.
 *
 * @component
 * @param {BoonPickerProps} props - Component props
 * @param {string} props.bloodlineSlug - Slug of the character's bloodline
 * @param {CharacterShard[]} props.selectedBoons - Currently selected boon shards
 * @param {number} props.boonBudget - Total boon point budget from the bloodline
 * @param {(boons: CharacterShard[]) => void} props.onToggle - Callback when a boon is toggled
 * @param {boolean} [props.readOnly=false] - When true, items are visible but not interactive
 * @param {string} [props.locale] - Unused; locale comes from `useLocale()`
 * @returns {JSX.Element} JSX tree
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

  /* Top-level boons only; `parentName` children are picked via sub-options. */
  const boons: BloodlineBoon[] = useMemo(
    () =>
      (bloodlines.find((b) => b.slug === bloodlineSlug)?.boons ?? []).filter(
        (boon) => !boon.parentName,
      ),
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

  const aspectFilter = useAspectFilter();
  /* The bar summarises the current picks; pressing one narrows the list. */
  const boonTagLists = useMemo(
    () => selectedBoons.map((s) => s.tags),
    [selectedBoons],
  );

  const filteredBoons = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return boons.filter(
      (b) =>
        (!q || b.name.toLowerCase().includes(q)) &&
        matchesAspects(b.tags, aspectFilter.selected),
    );
  }, [boons, searchQuery, aspectFilter.selected]);

  const displayedBoons = useMemo(
    () =>
      readOnly
        ? filteredBoons.filter((b) =>
            selectedBoons.some((s) => shardIs(s, b)),
          )
        : filteredBoons,
    [readOnly, filteredBoons, selectedBoons],
  );

  const bpSpent = computeBpSpent(selectedBoons);
  const bpRemaining = boonBudget - bpSpent;

  const isBoonSelected = (boon: BloodlineBoon) =>
    selectedBoons.some((s) => shardIs(s, boon));

  const handleToggle = async (boon: BloodlineBoon) => {
    if (isBoonSelected(boon)) {
      onToggle(selectedBoons.filter((s) => !shardIs(s, boon)));
      return;
    }

    if (boon.subOptions !== undefined && boon.subOptions.length > 0) {
      return;
    }

    const shard = await buildBoonShard(boon, bloodlineSlug, locale, {
      cache,
      mutate,
    });
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
          {!readOnly && (
            <AspectFilterBar
              tagLists={boonTagLists}
              selected={aspectFilter.selected}
              onToggle={aspectFilter.toggle}
              onClear={aspectFilter.clear}
            />
          )}
          <div className={pickerStyles.pickerScroll}>
            <ul
              className={styles.boonList}
              aria-label={t('ariaAvailableBoons')}>
              {displayedBoons.map((boon) => {
                const selected = isBoonSelected(boon);
                const isExpanded = expandedBoons.has(boon.name);
                const bodyId = `boon-body-${bloodlineSlug}-${boon.name.replace(/\s+/g, '-')}`;
                const cachedShard = selectedBoons.find((s) =>
                  shardIs(s, boon),
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
                    aspects={hasSubOptions ? undefined : boon.tags}
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
