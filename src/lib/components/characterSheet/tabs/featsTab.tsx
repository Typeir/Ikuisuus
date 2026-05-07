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

import { ContentShardPanel } from '@/lib/components/characterSheet/contentShardPanel';
import { Chip } from '@/lib/components/ui/chip';
import type {
  CharacterSheet as CharacterSheetType,
  CharacterShard,
} from '@/lib/types/character';
import { FeatPicker } from '../featPicker';
import styles from './tabs.module.scss';

/**
 * Props for `<FeatsTab>`.
 *
 * @interface FeatsTabProps
 * @property {CharacterSheetType} data - Active character data
 * @property {boolean} editing - Whether edit mode is active
 * @property {(patch: Partial<CharacterSheetType>) => void} onChange - Patch the draft
 * @property {string} [locale] - Content locale (default `en`)
 */
export interface FeatsTabProps {
  data: CharacterSheetType;
  editing: boolean;
  onChange: (patch: Partial<CharacterSheetType>) => void;
  locale?: string;
}

/**
 * Feats tab content.
 *
 * @component
 * @param {FeatsTabProps} props - Component props
 * @returns {JSX.Element} Rendered tab body
 */
export const FeatsTab: React.FC<FeatsTabProps> = ({
  data,
  editing,
  onChange,
  locale = 'en',
}) => {
  const selectedFeats = (data.selectedFeats ?? []) as CharacterShard[];

  const handleToggle = (next: CharacterShard[]) => {
    onChange({ selectedFeats: next });
  };

  const handleRemove = (id: string) => {
    if (!editing) return;
    handleToggle(selectedFeats.filter((f) => f.id !== id));
  };

  const latest = selectedFeats[selectedFeats.length - 1];

  return (
    <div className={styles.twoColumns}>
      <div className={styles.column}>
        {editing && (
          <FeatPicker
            selectedFeats={selectedFeats}
            onToggle={handleToggle}
            locale={locale}
          />
        )}
        {selectedFeats.length > 0 && (
          <div className={styles.chipCloud}>
            {selectedFeats.map((feat) => (
              <Chip
                key={feat.id}
                label={feat.heading}
                variant='feat'
                onRemove={editing ? () => handleRemove(feat.id) : undefined}
              />
            ))}
          </div>
        )}
        {!editing && selectedFeats.length === 0 && (
          <div className={styles.empty}>No feats selected.</div>
        )}
      </div>
      <div className={styles.column}>
        {latest ? (
          <ContentShardPanel
            contentType='feats'
            slug={latest.sourceFile}
            locale={locale}
          />
        ) : (
          <div className={styles.empty}>Select a feat to preview.</div>
        )}
      </div>
    </div>
  );
};
