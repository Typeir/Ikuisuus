/**
 * @fileoverview Feature Viewer Component
 * @description Displays the unlocked vocation and specialization features for a
 * character at their current level. Each feature is rendered as a `ShardDisplay`
 * card. Features above the character's level are grayed out and inaccessible.
 *
 * @module lib/components/characterSheet/featureViewer
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import type { CharacterShard } from '@/lib/types/character';
import { useTranslations } from 'next-intl';
import styles from './characterSheetWidgets.module.scss';
import { ShardDisplay } from './shardDisplay';

/**
 * Props for the FeatureViewer component.
 *
 * @interface FeatureViewerProps
 * @property {CharacterShard[]} vocationFeatures - Unlocked vocation feature shards
 * @property {CharacterShard[]} specializationFeatures - Unlocked specialization feature shards
 * @property {number} characterLevel - Current character level used to gate display
 * @property {string} [vocationTitle] - Display name for the vocation section header
 * @property {string} [specializationTitle] - Display name for the specialization section header
 */
export interface FeatureViewerProps {
  vocationFeatures: CharacterShard[];
  specializationFeatures: CharacterShard[];
  characterLevel: number;
  vocationTitle?: string;
  specializationTitle?: string;
}

/**
 * Renders vocation and specialization features grouped by section.
 * Features with `level > characterLevel` are shown as locked/dimmed.
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
}) => {
  const t = useTranslations('characterSheet');
  const resolvedVocationTitle = vocationTitle || t('vocationFeatures');
  const resolvedSpecTitle = specializationTitle || t('specializationFeatures');
  const renderFeatures = (features: CharacterShard[], label: string) => {
    if (features.length === 0) {
      return (
        <section className={styles.featureSection} aria-label={label}>
          <h3 className={styles.featureSectionTitle}>{label}</h3>
          <p className={styles.featureEmpty}>{t('noFeaturesSelected')}</p>
        </section>
      );
    }

    return (
      <section className={styles.featureSection} aria-label={label}>
        <h3 className={styles.featureSectionTitle}>{label}</h3>
        <div className={styles.featureList}>
          {features.map((shard) => {
            const locked =
              shard.level !== undefined && shard.level > characterLevel;
            return (
              <div
                key={shard.id}
                className={locked ? styles.featureLocked : undefined}
                aria-disabled={locked ? true : undefined}>
                <ShardDisplay shard={shard} />
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <div className={styles.featureViewer}>
      {renderFeatures(vocationFeatures, resolvedVocationTitle)}
      {renderFeatures(specializationFeatures, resolvedSpecTitle)}
    </div>
  );
};
