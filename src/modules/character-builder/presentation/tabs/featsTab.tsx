/**
 * @fileoverview Feats Tab
 * @description Renders the feat picker (live `/api/feats` data) plus a chip
 * cloud of currently selected feats. The right-hand column renders the most
 * recently selected feat's prose content via the content-shards API.
 *
 * @module lib/components/characterSheet/tabs/featsTab
 * @version 2.1.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { ResizablePane } from '@/lib/components/ui/resizablePane';
import type {
  CharacterShard,
  CharacterSheet as CharacterSheetType,
} from '@/lib/types/character';
import {
  useFocusedShard,
  useSheetEditing,
  useSheetMutators,
} from '@/modules/character-builder/application/context/activeSheetContext';
import {
  ContentShardPanel,
  type ContentShardType,
} from '@/modules/character-builder/presentation/shards/contentShardPanel';
import { ShardChip } from '@/modules/character-builder/presentation/shards/shardChip';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo } from 'react';
import { FeatPicker } from '../builder/featPicker';
import styles from './tabs.module.scss';

/**
 * Props for `<FeatsTab>`.
 *
 * @interface FeatsTabProps
 * @property {CharacterSheetType} data - Active character data
 * @property {(patch: Partial<CharacterSheetType>) => void} onChange - Patch the draft
 */
export interface FeatsTabProps {
  data: CharacterSheetType;
  onChange: (patch: Partial<CharacterSheetType>) => void;
}

/**
 * Feats tab content.
 *
 * @component
 * @param {FeatsTabProps} props - Component props
 * @returns {JSX.Element} Rendered tab body
 */
export const FeatsTab: React.FC<FeatsTabProps> = ({ data, onChange }) => {
  const t = useTranslations('characterSheet');
  const editing = useSheetEditing();
  const focusedShard = useFocusedShard();
  const mutators = useSheetMutators();
  const selectedFeats = useMemo(
    () => (data.selectedFeats ?? []) as CharacterShard[],
    [data.selectedFeats],
  );

  const handleToggle = useCallback(
    (next: CharacterShard[]) => onChange({ selectedFeats: next }),
    [onChange],
  );

  const handleRemove = useCallback(
    (id: string) => {
      if (!editing) return;
      onChange({
        selectedFeats: selectedFeats.filter((f) => f.id !== id),
      });
    },
    [editing, onChange, selectedFeats],
  );

  return (
    <ResizablePane
      id='builder.feats'
      ariaLabel='Feats'
      left={
        <div className={styles.column}>
          {editing && selectedFeats.length > 0 && (
            <div className={styles.chipCloud}>
              {selectedFeats.map((feat) => (
                <ShardChip
                  key={feat.id}
                  shard={feat}
                  color='primary'
                  onRemove={editing ? () => handleRemove(feat.id) : undefined}
                />
              ))}
            </div>
          )}
          <FeatPicker
            selectedFeats={selectedFeats}
            onToggle={handleToggle}
            readOnly={!editing}
            onFocusShard={mutators.setFocusedShard}
          />
        </div>
      }
      right={
        <div className={styles.column}>
          {focusedShard ? (
            <ContentShardPanel
              contentType={focusedShard.contentType as ContentShardType}
              slug={focusedShard.slug}
            />
          ) : (
            <div className={styles.empty}>{t('shardPreviewFallback')}</div>
          )}
        </div>
      }
    />
  );
};
