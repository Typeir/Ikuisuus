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
import { useFeats } from '@/lib/hooks/data/useFeats';
import type { CharacterShard } from '@/lib/types/character';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import styles from '../CharacterSheet/characterSheetWidgets.module.scss';
import pickerStyles from './pickerControls.module.scss';

/**
 * Props for `<FeatPicker>`.
 *
 * @interface FeatPickerProps
 * @property {CharacterShard[]} selectedFeats - Currently selected feat shards
 * @property {(feats: CharacterShard[]) => void} onToggle - Callback when a feat is toggled
 * @property {boolean} [readOnly] - When true, items are visible but not interactive
 */
export interface FeatPickerProps {
  selectedFeats: CharacterShard[];
  onToggle: (feats: CharacterShard[]) => void;
  readOnly?: boolean;
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
  readOnly = false,
}) => {
  const t = useTranslations('characterSheet.feats');
  const locale = useLocale();
  const { feats, isLoading: loading, error: fetchError } = useFeats({ locale });
  const error = fetchError?.message ?? null;
  const [searchQuery, setSearchQuery] = useState('');

  /** @param {string} slug - Feat slug to check */
  const toSourceFile = (slug: string) => `character-creation/feats/${slug}.mdx`;

  const isSelected = (slug: string) =>
    selectedFeats.some((s) => s.sourceFile === toSourceFile(slug));

  const filteredFeats = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return feats;
    return feats.filter((f) => f.title.toLowerCase().includes(q));
  }, [feats, searchQuery]);

  const handleToggle = (feat: FeatMetadata) => {
    const sf = toSourceFile(feat.slug);
    if (isSelected(feat.slug)) {
      onToggle(selectedFeats.filter((s) => s.sourceFile !== sf));
      return;
    }
    const shard: CharacterShard = {
      id: `feat::${feat.slug}`,
      sourceFile: sf,
      heading: feat.title,
      category: 'feat',
      cachedText: feat.description ?? undefined,
    };
    onToggle([...selectedFeats, shard]);
  };

  return (
    <div className={styles.boonPicker}>
      {loading && <p className={styles.boonLoading}>{t('loading')}</p>}
      {error && <p className={styles.boonError}>{error}</p>}

      {!loading && !error && (
        <>
          <input
            type='search'
            className={pickerStyles.pickerSearch}
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label={t('searchPlaceholder')}
          />
          <div className={pickerStyles.pickerScroll}>
            <ul className={styles.boonList} aria-label='Available feats'>
              {filteredFeats.map((feat) => {
                const selected = isSelected(feat.slug);
                return (
                  <li
                    key={feat.slug}
                    className={`${styles.boonCard} ${selected ? styles.boonSelected : ''}`}>
                    <button
                      type='button'
                      className={styles.boonToggleBtn}
                      onClick={() => handleToggle(feat)}
                      disabled={readOnly}
                      aria-pressed={selected}>
                      <span className={styles.boonName}>{feat.title}</span>
                      {feat.hasPrerequisite && (
                        <span className={styles.boonBpBadge}>
                          {t('prereq')}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
              {filteredFeats.length === 0 && (
                <li className={styles.boonEmpty}>{t('noAvailable')}</li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};
