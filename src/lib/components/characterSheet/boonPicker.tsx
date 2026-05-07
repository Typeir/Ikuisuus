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
 * @version 1.1.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import type { BloodlineBoon } from '@/lib/db/content/schemas/bloodlineMetadata.d';
import type { CharacterShard } from '@/lib/types/character';
import { computeBpSpent } from '@/lib/utils/shardExtractor';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import styles from './characterSheetWidgets.module.scss';

/**
 * Shape of `/api/bloodlines` response item.
 *
 * @interface BloodlineListItem
 * @property {string} slug - Bloodline identifier
 * @property {string} title - Display name
 * @property {number} [boonBudget] - Total boon point budget
 * @property {BloodlineBoon[]} boons - Available boons
 */
interface BloodlineListItem {
  slug: string;
  title: string;
  boonBudget?: number;
  boons: BloodlineBoon[];
}

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
 * toggle cards, and shows an advisory budget meter.
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
  const [boons, setBoons] = useState<BloodlineBoon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('characterSheet');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/bloodlines?locale=${locale}`)
      .then((r) =>
        r.ok ? (r.json() as Promise<BloodlineListItem[]>) : Promise.resolve([]),
      )
      .then((data) => {
        if (cancelled) return;
        const bl = Array.isArray(data)
          ? data.find((b) => b.slug === bloodlineSlug)
          : undefined;
        if (bl) {
          setBoons(bl.boons);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bloodlineSlug, locale]);

  const bpSpent = computeBpSpent(selectedBoons);
  const bpRemaining = boonBudget - bpSpent;

  const isBoonSelected = (name: string) =>
    selectedBoons.some((s) => s.heading === name);

  const handleToggle = async (boon: BloodlineBoon) => {
    if (isBoonSelected(boon.name)) {
      onToggle(selectedBoons.filter((s) => s.heading !== boon.name));
      return;
    }

    let cachedText: string | undefined;
    try {
      const res = await fetch(
        `/api/content-shards/bloodlines/${bloodlineSlug}?keys[]=${encodeURIComponent(boon.name)}&locale=${locale}`,
      );
      if (res.ok) {
        const data = (await res.json()) as {
          shards: Record<string, string>;
        };
        cachedText = data.shards[boon.name];
      }
    } catch {
      /** cachedText stays undefined; ShardDisplay will lazy-fetch on expand */
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

      {loading && <p className={styles.boonLoading}>{t('loadingBoons')}</p>}
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
