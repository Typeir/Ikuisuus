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

import { Skeleton, SkeletonGroup } from '@/lib/components/skeleton/skeleton';
import type { FeatMetadata } from '@/lib/db/content/schemas/featMetadata';
import { useFeats } from '@/lib/hooks/data/useFeats';
import { useIsMobileViewport } from '@/lib/hooks/useMediaQuery';
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
 * @param {CharacterShard[]} props.selectedFeats - Currently selected feat shards
 * @param {(feats: CharacterShard[]) => void} props.onToggle - Callback when a feat is toggled
 * @param {boolean} [props.readOnly=false] - When true, items are visible but not interactive
 * @param {(shard: { contentType: string; slug: string }) => void} [props.onFocusShard] - Optional callback to focus a shard's detail view by its content type and slug
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
  const isMobile = useIsMobileViewport();
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
      grants: feat.grants,
    };
    onToggle([...selectedFeats, shard]);
  };

  /** @param {string} slug - Feat slug to count instances of */
  const countFor = (slug: string) =>
    selectedFeats.filter((s) => s.sourceFile === toSourceFile(slug)).length;

  /**
   * Appends one more instance of a repeatable feat, keyed by a unique id so
   * multiple copies coexist in the shard list.
   *
   * @param {FeatMetadata} feat - Feat to add another instance of
   */
  const addInstance = (feat: FeatMetadata) => {
    const shard: CharacterShard = {
      id: `feat::${feat.slug}::${crypto.randomUUID()}`,
      sourceFile: toSourceFile(feat.slug),
      heading: feat.title,
      category: 'feat',
      cachedText: feat.description ?? undefined,
      grants: feat.grants,
    };
    onToggle([...selectedFeats, shard]);
  };

  /**
   * Removes the most recently added instance of a repeatable feat.
   *
   * @param {FeatMetadata} feat - Feat to remove one instance of
   */
  const removeInstance = (feat: FeatMetadata) => {
    const sf = toSourceFile(feat.slug);
    const lastIdx = selectedFeats.map((s) => s.sourceFile).lastIndexOf(sf);
    if (lastIdx === -1) return;
    onToggle(selectedFeats.filter((_, i) => i !== lastIdx));
  };

  return (
    <div className={styles.boonPicker}>
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
            <ul className={styles.boonList} aria-label={t('featAvailableAria')}>
              {displayedFeats.map((feat) => {
                const multi = feat.multiSelect === true;
                const count = multi ? countFor(feat.slug) : 0;
                const selected = multi ? count > 0 : isSelected(feat.slug);
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
                    multiSelect={
                      multi
                        ? {
                            count,
                            onAdd: () => addInstance(feat),
                            onRemove: () => removeInstance(feat),
                            addLabel: t('addInstance', { name: feat.title }),
                            removeLabel: t('removeInstance', { name: feat.title }),
                            countLabel: t('instanceCount', { count }),
                          }
                        : undefined
                    }
                    onExpand={() => toggleExpanded(feat.slug)}
                    onFocus={
                      isMobile === true
                        ? () =>
                            onFocusShard?.({
                              contentType: 'feats',
                              slug: feat.slug,
                            })
                        : undefined
                    }
                    contentType='feats'
                    contentSlug={feat.slug}
                    contentKey={feat.title}
                    cachedText={feat.description}
                    bodyId={bodyId}
                    expandLabel={expandLabel}
                    openLabel={t('viewShardDetails')}
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
