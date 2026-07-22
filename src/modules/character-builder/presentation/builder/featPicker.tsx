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
import { useCallback, useMemo, useState } from 'react';
import styles from '../CharacterSheet/characterSheetWidgets.module.scss';
import { FeatureCard } from './featureCard';
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
  onFocusShard?: (shard: { contentType: string; slug: string }) => void;
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
  onFocusShard,
}) => {
  const t = useTranslations('characterSheet.feats');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const { feats, isLoading: loading, error: fetchError } = useFeats({ locale });
  const error = fetchError?.message ?? null;
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFeats, setExpandedFeats] = useState<Set<string>>(
    () => new Set(),
  );

  const toggleExpanded = useCallback((slug: string) => {
    setExpandedFeats((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }, []);

  /** @param {string} slug - Feat slug to check */
  const toSourceFile = (slug: string) => `character-creation/feats/${slug}.mdx`;

  const isSelected = (slug: string) =>
    selectedFeats.some((s) => s.sourceFile === toSourceFile(slug));

  const filteredFeats = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return feats;
    return feats.filter((f) => f.title.toLowerCase().includes(q));
  }, [feats, searchQuery]);

  const displayedFeats = useMemo(
    () =>
      readOnly
        ? filteredFeats.filter((f) =>
            selectedFeats.some((s) => s.sourceFile === toSourceFile(f.slug)),
          )
        : filteredFeats,
    [readOnly, filteredFeats, selectedFeats],
  );

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
            <ul className={styles.boonList} aria-label={t('featAvailableAria')}>
              {displayedFeats.map((feat) => {
                const selected = isSelected(feat.slug);
                const isExpanded = expandedFeats.has(feat.slug);
                const bodyId = `feat-body-${feat.slug.replace(/\s+/g, '-')}`;
                const expandLabel = isExpanded
                  ? t('shardCollapseAria', { name: feat.title })
                  : t('shardExpandAria', { name: feat.title });
                return (
                  <FeatureCard
                    key={feat.slug}
                    label={feat.title}
                    badge={feat.hasPrerequisite ? t('prereq') : undefined}
                    selected={selected}
                    expanded={isExpanded}
                    readOnly={readOnly}
                    onToggle={() => handleToggle(feat)}
                    onExpand={() => toggleExpanded(feat.slug)}
                    onFocus={() =>
                      onFocusShard?.({ contentType: 'feats', slug: feat.slug })
                    }
                    contentType='feats'
                    contentSlug={feat.slug}
                    contentKey={feat.title}
                    cachedText={feat.description}
                    bodyId={bodyId}
                    expandLabel={expandLabel}
                  />
                );
              })}
              {displayedFeats.length === 0 && (
                <li className={styles.boonEmpty}>{t('noAvailable')}</li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};
