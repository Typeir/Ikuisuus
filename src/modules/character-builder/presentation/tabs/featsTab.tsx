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

import type { CharacterShard } from '@/lib/types/character';
import {
  useSheetData,
  useSheetEditing,
  useSheetMutators,
} from '@/modules/character-builder/application/context/activeSheetContext';
import {
  ContentShardPanel,
  type ContentShardType,
} from '@/modules/character-builder/presentation/shards/contentShardPanel';
import { ShardChip } from '@/modules/character-builder/presentation/shards/shardChip';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { UnassignedChips } from '../atoms/unassignedChips';
import { BuilderSplitPane } from '../builder/builderSplitPane';
import { FeatPicker } from '../builder/featPicker';
import styles from './tabs.module.scss';

/** Benefit categories the feats tab accounts for. */
const FEAT_CATEGORIES = ['feat'] as const;

/**
 * The content shard whose prose fills the right-hand panel.
 *
 * @interface FocusedShard
 * @property {string} contentType - Shard route segment (e.g. `feats`)
 * @property {string} slug - Content item slug
 */
interface FocusedShard {
  contentType: string;
  slug: string;
}

/**
 * Feats tab content. Reads the character and edit mode from the active-sheet
 * context.
 *
 * @component
 * @returns {JSX.Element} Rendered tab body
 */
export const FeatsTab: React.FC = () => {
  const t = useTranslations('characterSheet');
  const data = useSheetData();
  const editing = useSheetEditing();
  const mutators = useSheetMutators();
  const [focusedShard, setFocusedShard] = useState<FocusedShard | null>(null);
  const selectedFeats = useMemo(
    () => (data.selectedFeats ?? []) as CharacterShard[],
    [data.selectedFeats],
  );

  const handleToggle = useCallback(
    (next: CharacterShard[]) => mutators.patch({ selectedFeats: next }),
    [mutators],
  );

  const handleRemove = useCallback(
    (id: string) => {
      if (!editing) return;
      mutators.patch({
        selectedFeats: selectedFeats.filter((f) => f.id !== id),
      });
    },
    [editing, mutators, selectedFeats],
  );

  return (
    <BuilderSplitPane
      id='builder.feats'
      ariaLabel={t('tabFeats')}
      sheetTitle={t('shardPreviewTitle', { name: t('tabFeats') })}
      sheetOpen={!!focusedShard}
      onSheetClose={() => setFocusedShard(null)}
      left={
        <div className={`${styles.column} ${styles.featColumn}`}>
          <UnassignedChips categories={FEAT_CATEGORIES} />
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
            onFocusShard={setFocusedShard}
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
