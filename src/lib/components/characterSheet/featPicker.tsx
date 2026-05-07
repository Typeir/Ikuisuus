/**
 * @fileoverview Feat Picker Component
 * @description Fetches `/api/feats` and renders a toggleable list of feats.
 * Selected feats are stored as `CharacterShard` entries with `category: 'feat'`
 * so the same shard rendering pipeline used elsewhere can display them.
 *
 * @module lib/components/characterSheet/featPicker
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import type { FeatMetadata } from '@/lib/db/content/schemas/featMetadata';
import type { CharacterShard } from '@/lib/types/character';
import { useEffect, useState } from 'react';
import styles from './characterSheetWidgets.module.scss';

/**
 * Props for `<FeatPicker>`.
 *
 * @interface FeatPickerProps
 * @property {CharacterShard[]} selectedFeats - Currently selected feat shards
 * @property {(feats: CharacterShard[]) => void} onToggle - Callback when a feat is toggled
 * @property {string} [locale] - Content locale (default `en`)
 */
export interface FeatPickerProps {
  selectedFeats: CharacterShard[];
  onToggle: (feats: CharacterShard[]) => void;
  locale?: string;
}

/**
 * Feat picker panel. Fetches available feats, renders them as toggle cards.
 *
 * @component
 * @param {FeatPickerProps} props - Component props
 * @returns {JSX.Element} Rendered feat picker
 */
export const FeatPicker: React.FC<FeatPickerProps> = ({
  selectedFeats,
  onToggle,
  locale = 'en',
}) => {
  const [feats, setFeats] = useState<FeatMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/feats?locale=${locale}`)
      .then((r) =>
        r.ok ? (r.json() as Promise<FeatMetadata[]>) : Promise.resolve([]),
      )
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setFeats(data);
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
  }, [locale]);

  const isSelected = (slug: string) =>
    selectedFeats.some((s) => s.sourceFile === slug);

  const handleToggle = async (feat: FeatMetadata) => {
    if (isSelected(feat.slug)) {
      onToggle(selectedFeats.filter((s) => s.sourceFile !== feat.slug));
      return;
    }

    let cachedText: string | undefined;
    try {
      const res = await fetch(
        `/api/content-shards/feats/${feat.slug}?keys[]=main&locale=${locale}`,
      );
      if (res.ok) {
        const data = (await res.json()) as { shards: Record<string, string> };
        cachedText = data.shards.main;
      }
    } catch {
      /** cachedText stays undefined; consumer can lazy-fetch on expand */
    }

    const shard: CharacterShard = {
      id: `feat::${feat.slug}`,
      sourceFile: feat.slug,
      heading: feat.title,
      category: 'feat',
      cachedText,
    };
    onToggle([...selectedFeats, shard]);
  };

  return (
    <div className={styles.boonPicker}>
      {loading && <p className={styles.boonLoading}>Loading feats…</p>}
      {error && <p className={styles.boonError}>{error}</p>}

      {!loading && !error && (
        <ul className={styles.boonList} aria-label='Available feats'>
          {feats.map((feat) => {
            const selected = isSelected(feat.slug);
            return (
              <li
                key={feat.slug}
                className={`${styles.boonCard} ${selected ? styles.boonSelected : ''}`}>
                <button
                  type='button'
                  className={styles.boonToggleBtn}
                  onClick={() => handleToggle(feat)}
                  aria-pressed={selected}>
                  <span className={styles.boonName}>{feat.title}</span>
                  {feat.hasPrerequisite && (
                    <span className={styles.boonBpBadge}>Prereq</span>
                  )}
                </button>
              </li>
            );
          })}
          {feats.length === 0 && (
            <li className={styles.boonEmpty}>No feats available.</li>
          )}
        </ul>
      )}
    </div>
  );
};
