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

import type { CharacterShard } from '@/lib/types/character';
import {
    useSheetData,
    useSheetEditing,
    useSheetMutators,
} from '@/modules/character-builder/application/context/activeSheetContext';
import { ContentShardPanel } from '@/modules/character-builder/presentation/shards/contentShardPanel';
import { ShardChip } from '@/modules/character-builder/presentation/shards/shardChip';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { BoonPicker } from '../builder/boonPicker';
import { BuilderSplitPane } from '../builder/builderSplitPane';
import styles from './tabs.module.scss';

/**
 * Bloodline tab content. Reads the character and edit mode from the
 * active-sheet context.
 *
 * @component
 * @returns {JSX.Element} Rendered tab body
 */
export const BloodlineTab: React.FC = () => {
  const t = useTranslations('characterSheet');
  const data = useSheetData();
  const editing = useSheetEditing();
  const { patch } = useSheetMutators();

  const handleBoonsToggle = useCallback(
    (boons: CharacterShard[]) => patch({ selectedBoons: boons }),
    [patch],
  );

  const handleRemoveBoon = useCallback(
    (id: string) => {
      patch({
        selectedBoons: data.selectedBoons.filter((b) => b.id !== id),
      });
    },
    [data.selectedBoons, patch],
  );

  if (!data.bloodlineSlug) {
    return <div className={styles.empty}>{t('selectBloodline')}</div>;
  }

  return (
    <BuilderSplitPane
      id='builder.bloodline'
      ariaLabel={t('selectBloodline')}
      sheetTitle={t('shardPreviewTitle', { name: data.bloodlineTitle || '' })}
      mobileTriggerLabel={t('viewShardDetails')}
      left={
        <div className={styles.column}>
          {editing && data.selectedBoons.length > 0 && (
            <div className={styles.chipCloud}>
              {data.selectedBoons.map((boon) => (
                <ShardChip
                  key={boon.id}
                  shard={boon}
                  color='primary'
                  onRemove={
                    editing ? () => handleRemoveBoon(boon.id) : undefined
                  }
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
      }
      right={
        <div className={styles.column}>
          <ContentShardPanel
            contentType='bloodlines'
            slug={data.bloodlineSlug}
          />
        </div>
      }
    />
  );
};
