/**
 * @fileoverview Vocation Tab
 * @description Two-column vocation viewer: feature shards (vocation +
 * specialization) on the left; rendered markdown content via the
 * content-shards API on the right.
 *
 * @module lib/components/characterSheet/tabs/vocationTab
 * @version 1.1.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { ContentShardPanel } from '@/lib/components/characterSheet/contentShardPanel';
import type { CharacterSheet as CharacterSheetType } from '@/lib/types/character';
import { useTranslations } from 'next-intl';
import { FeatureViewer } from '../featureViewer';
import styles from './tabs.module.scss';

/**
 * Props for `<VocationTab>`.
 *
 * @interface VocationTabProps
 * @property {CharacterSheetType} data - Active character data
 * @property {string} [locale] - Content locale (default `en`)
 */
export interface VocationTabProps {
  data: CharacterSheetType;
  locale?: string;
}

/**
 * Vocation tab content.
 *
 * @component
 * @param {VocationTabProps} props - Component props
 * @returns {JSX.Element} Rendered tab body
 */
export const VocationTab: React.FC<VocationTabProps> = ({
  data,
  locale = 'en',
}) => {
  const t = useTranslations('characterSheet');

  if (!data.vocationSlug) {
    return <div className={styles.empty}>{t('selectVocation')}</div>;
  }

  const previewSlug = data.specializationSlug ?? data.vocationSlug;
  const previewKind = data.specializationSlug ? 'specializations' : 'vocations';
  const previewTitle = data.specializationTitle || data.vocationTitle;

  return (
    <div className={styles.twoColumns}>
      <div className={styles.column}>
        <FeatureViewer
          vocationFeatures={data.vocationFeatures}
          specializationFeatures={data.specializationFeatures}
          characterLevel={data.level}
          vocationTitle={data.vocationTitle || t('vocationFeatures')}
          specializationTitle={
            data.specializationTitle || t('specializationFeatures')
          }
        />
      </div>
      <div className={styles.column}>
        <ContentShardPanel
          contentType={previewKind}
          slug={previewSlug}
          locale={locale}
        />
      </div>
    </div>
  );
};
