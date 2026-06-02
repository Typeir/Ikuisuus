/**
 * @fileoverview Feature Viewer Component
 * @description Displays vocation and specialization features for a character at
 * their current level. Features above the character's level are rendered as
 * locked/dimmed `ShardDisplay` cards (not hidden). When no selection has been
 * made the section shows a "nothing selected" prompt instead.
 *
 * Supports a `section` prop to render only one of the two feature lists.
 * Useful when callers (such as the Vocation tab) want to display the lists
 * inside their own tab structure rather than stacked.
 *
 * @module lib/components/characterSheet/featureViewer
 * @version 3.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import type { CharacterShard } from '@/lib/types/character';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import styles from '../CharacterSheet/characterSheetWidgets.module.scss';
import { ShardDisplay } from '../shards/shardDisplay';
import pickerStyles from './pickerControls.module.scss';

/**
 * Which section(s) the FeatureViewer should render.
 *
 * @typedef {'both' | 'vocation' | 'specialization'} FeatureViewerSection
 */
export type FeatureViewerSection = 'both' | 'vocation' | 'specialization';

/**
 * Props for the FeatureViewer component.
 *
 * @interface FeatureViewerProps
 * @property {CharacterShard[]} vocationFeatures - Vocation feature shards (all levels)
 * @property {CharacterShard[]} specializationFeatures - Specialization feature shards (all levels)
 * @property {number} characterLevel - Current character level; features above this are locked/dimmed
 * @property {string} [vocationTitle] - Display name for the vocation section header
 * @property {string} [specializationTitle] - Display name for the specialization section header
 * @property {boolean} [hasVocation] - Whether a vocation has been selected; controls empty-state text
 * @property {boolean} [hasSpecialization] - Whether a specialization has been selected; controls empty-state text
 * @property {FeatureViewerSection} [section] - Which section to render: `'both'` (default), `'vocation'`, or `'specialization'`
 * @property {boolean} [hideTitle] - When true, suppresses the section heading (useful inside tab panels that already label the section)
 */
export interface FeatureViewerProps {
  vocationFeatures: CharacterShard[];
  specializationFeatures: CharacterShard[];
  characterLevel: number;
  vocationTitle?: string;
  specializationTitle?: string;
  hasVocation?: boolean;
  hasSpecialization?: boolean;
  section?: FeatureViewerSection;
  hideTitle?: boolean;
}

/**
 * Renders vocation and specialization features grouped by section.
 * Features with `level > characterLevel` are shown as locked/dimmed cards.
 * When no selection has been made an appropriate "nothing selected" message
 * is shown; when a selection exists but has no features, "No features
 * available." is shown instead.
 *
 * @component
 * @param {FeatureViewerProps} props - Component props
 * @returns {JSX.Element} Rendered feature viewer
 */
export const FeatureViewer: React.FC<FeatureViewerProps> = ({
  vocationFeatures,
  specializationFeatures,
  characterLevel,
  vocationTitle,
  specializationTitle,
  hasVocation = false,
  hasSpecialization = false,
  section = 'both',
  hideTitle = false,
}) => {
  const t = useTranslations('characterSheet');
  const resolvedVocationTitle = vocationTitle || t('vocationFeatures');
  const resolvedSpecTitle = specializationTitle || t('specializationFeatures');
  const [vocationQuery, setVocationQuery] = useState('');
  const [specQuery, setSpecQuery] = useState('');

  const filterByHeading = (list: CharacterShard[], q: string) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((s) => s.heading.toLowerCase().includes(needle));
  };

  const filteredVocation = useMemo(
    () => filterByHeading(vocationFeatures, vocationQuery),
    [vocationFeatures, vocationQuery],
  );
  const filteredSpec = useMemo(
    () => filterByHeading(specializationFeatures, specQuery),
    [specializationFeatures, specQuery],
  );

  const renderFeatures = (
    features: CharacterShard[],
    rawFeatures: CharacterShard[],
    label: string,
    hasSelection: boolean,
    emptyKey: 'noVocationSelected' | 'noSpecializationSelected',
    query: string,
    setQuery: (q: string) => void,
  ) => {
    if (rawFeatures.length === 0) {
      const emptyText = hasSelection ? t('noFeaturesSelected') : t(emptyKey);
      return (
        <section className={styles.featureSection} aria-label={label}>
          {!hideTitle && (
            <h3 className={styles.featureSectionTitle}>{label}</h3>
          )}
          <p className={styles.featureEmpty}>{emptyText}</p>
        </section>
      );
    }

    return (
      <section className={styles.featureSection} aria-label={label}>
        {!hideTitle && <h3 className={styles.featureSectionTitle}>{label}</h3>}
        <input
          type='search'
          className={pickerStyles.pickerSearch}
          placeholder={t('searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t('searchPlaceholder')}
        />
        <div className={pickerStyles.pickerScroll}>
          <div className={styles.featureList}>
            {features.map((shard) => {
              const locked =
                shard.level !== undefined && shard.level > characterLevel;
              return (
                <div
                  key={shard.id}
                  className={locked ? styles.featureLocked : undefined}>
                  <ShardDisplay shard={shard} />
                </div>
              );
            })}
            {features.length === 0 && (
              <p className={styles.featureEmpty}>{t('noFeaturesSelected')}</p>
            )}
          </div>
        </div>
      </section>
    );
  };

  const showVocation = section === 'both' || section === 'vocation';
  const showSpec = section === 'both' || section === 'specialization';

  return (
    <div className={styles.featureViewer}>
      {showVocation &&
        renderFeatures(
          filteredVocation,
          vocationFeatures,
          resolvedVocationTitle,
          hasVocation,
          'noVocationSelected',
          vocationQuery,
          setVocationQuery,
        )}
      {showSpec &&
        renderFeatures(
          filteredSpec,
          specializationFeatures,
          resolvedSpecTitle,
          hasSpecialization,
          'noSpecializationSelected',
          specQuery,
          setSpecQuery,
        )}
    </div>
  );
};
