/**
 * @fileoverview Bloodline Tab
 * @description Two-column bloodline editor: BoonPicker on the left, rendered
 * markdown content via the content-shards API on the right.
 *
 * @module lib/components/characterSheet/tabs/bloodlineTab
 * @version 1.1.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { ContentShardPanel } from '@/lib/components/characterSheet/contentShardPanel';
import type {
    CharacterShard,
    CharacterSheet as CharacterSheetType,
} from '@/lib/types/character';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { BoonPicker } from '../boonPicker';
import styles from './tabs.module.scss';

/**
 * Props for `<BloodlineTab>`.
 *
 * @interface BloodlineTabProps
 * @property {CharacterSheetType} data - Active character data
 * @property {boolean} editing - Whether edit mode is active
 * @property {(patch: Partial<CharacterSheetType>) => void} onChange - Patch the draft
 * @property {string} [locale] - Content locale (default `en`)
 */
export interface BloodlineTabProps {
  data: CharacterSheetType;
  editing: boolean;
  onChange: (patch: Partial<CharacterSheetType>) => void;
  locale?: string;
}

/**
 * Bloodline tab content.
 *
 * @component
 * @param {BloodlineTabProps} props - Component props
 * @returns {JSX.Element} Rendered tab body
 */
export const BloodlineTab: React.FC<BloodlineTabProps> = ({
  data,
  editing,
  onChange,
  locale = 'en',
}) => {
  const t = useTranslations('characterSheet');

  const handleBoonsToggle = useCallback(
    (boons: CharacterShard[]) => onChange({ selectedBoons: boons }),
    [onChange],
  );

  if (!data.bloodlineSlug) {
    return <div className={styles.empty}>{t('selectBloodline')}</div>;
  }

  return (
    <div className={styles.twoColumns}>
      <div className={styles.column}>
        {editing ? (
          <BoonPicker
            bloodlineSlug={data.bloodlineSlug}
            selectedBoons={data.selectedBoons}
            boonBudget={data.boonBudget}
            onToggle={handleBoonsToggle}
            locale={locale}
          />
        ) : (
          <div className={styles.placeholderCard}>{t('edit')}</div>
        )}
      </div>
      <div className={styles.column}>
        <ContentShardPanel
          contentType='bloodlines'
          slug={data.bloodlineSlug}
          locale={locale}
        />
      </div>
    </div>
  );
};
