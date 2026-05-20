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

import { useSheetEditing } from '@/lib/components/characterSheet/context/activeSheetContext';
import { ContentShardPanel } from '@/lib/components/characterSheet/shards/contentShardPanel';
import { ShardChip } from '@/lib/components/characterSheet/shards/shardChip';
import type {
    CharacterShard,
    CharacterSheet as CharacterSheetType,
} from '@/lib/types/character';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { BoonPicker } from '../builder/boonPicker';
import styles from './tabs.module.scss';

/**
 * Props for `<BloodlineTab>`.
 *
 * @interface BloodlineTabProps
 * @property {CharacterSheetType} data - Active character data
 * @property {(patch: Partial<CharacterSheetType>) => void} onChange - Patch the draft
 */
export interface BloodlineTabProps {
  data: CharacterSheetType;
  onChange: (patch: Partial<CharacterSheetType>) => void;
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
  onChange,
}) => {
  const t = useTranslations('characterSheet');
  const editing = useSheetEditing();

  const handleBoonsToggle = useCallback(
    (boons: CharacterShard[]) => onChange({ selectedBoons: boons }),
    [onChange],
  );

  const handleRemoveBoon = useCallback(
    (id: string) => {
      onChange({
        selectedBoons: data.selectedBoons.filter((b) => b.id !== id),
      });
    },
    [data.selectedBoons, onChange],
  );

  if (!data.bloodlineSlug) {
    return <div className={styles.empty}>{t('selectBloodline')}</div>;
  }

  return (
    <div className={styles.twoColumns}>
      <div className={styles.column}>
        {data.selectedBoons.length > 0 && (
          <div className={styles.chipCloud}>
            {data.selectedBoons.map((boon) => (
              <ShardChip
                key={boon.id}
                shard={boon}
                color='primary'
                onRemove={editing ? () => handleRemoveBoon(boon.id) : undefined}
              />
            ))}
          </div>
        )}
        <BoonPicker
          bloodlineSlug={data.bloodlineSlug}
          selectedBoons={data.selectedBoons}
          boonBudget={data.boonBudget}
          onToggle={handleBoonsToggle}
          readOnly={!editing}
        />
      </div>
      <div className={styles.column}>
        <ContentShardPanel contentType='bloodlines' slug={data.bloodlineSlug} />
      </div>
    </div>
  );
};
