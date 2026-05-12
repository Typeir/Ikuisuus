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
import { computeBpSpent } from '@/lib/utils/shardExtractor';
import { useTranslations } from 'next-intl';
import { useSWRConfig } from 'swr';
import styles from './characterSheetWidgets.module.scss';

/**
 * Props for the BoonPicker component.
 *
 * @interface BoonPickerProps
 * @property {string} bloodlineSlug - Slug of the character's bloodline
 * @property {CharacterShard[]} selectedBoons - Currently selected boon shards
 * @property {number} boonBudget - Total boon point budget from the bloodline
 * @property {(boons: CharacterShard[]) => void} onToggle - Callback when a boon is toggled
 * @property {string} [locale] - Content locale (default `en`)
 */
export interface BoonPickerProps {
  bloodlineSlug: string;
  selectedBoons: CharacterShard[];
  boonBudget: number;
  onToggle: (boons: CharacterShard[]) => void;
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
  locale = 'en',
}) => {
  const {
    bloodlines,
    isLoading: loading,
    error: fetchError,
  } = useBloodlines({ locale });
  const error = fetchError?.message ?? null;
  const boons: BloodlineBoon[] =
    bloodlines.find((b) => b.slug === bloodlineSlug)?.boons ?? [];
  const t = useTranslations('characterSheet');
  const { cache, mutate } = useSWRConfig();

  const bpSpent = computeBpSpent(selectedBoons);
  const bpRemaining = boonBudget - bpSpent;

  const isBoonSelected = (name: string) =>
    selectedBoons.some((s) => s.heading === name);

  const handleToggle = async (boon: BloodlineBoon) => {
    if (isBoonSelected(boon.name)) {
      onToggle(selectedBoons.filter((s) => s.heading !== boon.name));
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
      sourceFile: bloodlineSlug,
      heading: boon.name,
      category: 'boon',
      bpCost: boon.bpValue,
      cachedText,
    };
    onToggle([...selectedBoons, shard]);
  };

  return (
    <div className={styles.boonPicker}>
      <div className={styles.boonBudgetMeter} aria-label={t('ariaBoonBudget')}>
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
        <ul className={styles.boonList} aria-label={t('ariaAvailableBoons')}>
          {boons.map((boon) => {
            const selected = isBoonSelected(boon.name);
            return (
              <li
                key={boon.name}
                className={`${styles.boonCard} ${selected ? styles.boonSelected : ''}`}>
                <button
                  type='button'
                  className={styles.boonToggleBtn}
                  onClick={() => handleToggle(boon)}
                  aria-pressed={selected}>
                  <span className={styles.boonName}>{boon.name}</span>
                  {boon.bpValue !== undefined && (
                    <span className={styles.boonBpBadge}>
                      {boon.bpValue} {t('bpUnit')}
                    </span>
                  )}
                  {boon.bpValue === undefined && (
                    <span className={styles.boonBpBadge}>{boon.bpLabel}</span>
                  )}
                </button>
              </li>
            );
          })}
          {boons.length === 0 && (
            <li className={styles.boonEmpty}>{t('noBoonsAvailable')}</li>
          )}
        </ul>
      )}
    </div>
  );
};
