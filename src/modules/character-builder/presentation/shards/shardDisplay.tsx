/**
 * @fileoverview Shard Display Component
 * @description Renders a `CharacterShard` as an expand/collapse card. On first
 * expand the full heading block is fetched from the DB-backed
 * `/api/content-shards/[type]/[slug]` endpoint and cached in state.
 * Renders the shard heading, category badge, BP cost (if boon), level (if feature),
 * and collapsible body text.
 *
 * @module lib/components/characterSheet/shardDisplay
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import type { CharacterShard } from '@/lib/types/character';
import { shardToPreview } from '@/modules/character-builder/lib/utils/shardToPreview';
import { ContentExpandBody } from '@/modules/character-builder/presentation/builder/contentExpandBody';
import type { ContentShardType } from '@/modules/character-builder/presentation/shards/contentShardPanel';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import styles from '../CharacterSheet/characterSheetWidgets.module.scss';
import { displayAspects } from '@/modules/library/domain/aspects';
import { AspectGlyphs } from '@/modules/library/presentation/components/Aspects/AspectGlyphs';

/**
 * Props for the ShardDisplay component.
 *
 * @interface ShardDisplayProps
 * @property {CharacterShard} shard - The shard to render
 * @property {boolean} [defaultExpanded] - When true, card starts in expanded state
 */
export interface ShardDisplayProps {
  shard: CharacterShard;
  defaultExpanded?: boolean;
  onExpand?: () => void;
}

/**
 * Expand/collapse shard card. Fetches body text lazily on first expand.
 *
 * @component
 * @param {ShardDisplayProps} props - Component props
 * @param {CharacterShard} props.shard - The shard to render
 * @param {boolean} [props.defaultExpanded=false] - When true, card starts in expanded state
 * @param {() => void} [props.onExpand] - Callback invoked the first time the card is expanded
 * @returns {JSX.Element} Rendered shard card
 */
export const ShardDisplay: React.FC<ShardDisplayProps> = ({
  shard,
  defaultExpanded = false,
  onExpand,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const t = useTranslations('characterSheet');
  const tCommon = useTranslations('common');
  const preview = shardToPreview(shard.sourceFile);

  const handleToggle = useCallback(() => {
    if (!expanded) {
      onExpand?.();
    }
    setExpanded((prev) => !prev);
  }, [expanded, onExpand]);

  const categoryLabel =
    shard.category === 'boon'
      ? t('shardCategoryBoon')
      : shard.category === 'vocation-feature'
        ? t('shardCategoryVocation')
        : shard.category === 'feat'
          ? t('shardCategoryFeat')
          : t('shardCategorySpecialization');

  const bodyId = `shard-body-${shard.id.replace(/\s+/g, '-')}`;
  const expandLabel = expanded
    ? t('shardCollapseAria', { name: shard.heading })
    : t('shardExpandAria', { name: shard.heading });
  const Chevron = expanded ? ChevronDown : ChevronRight;

  return (
    <div
      className={`${styles.shardCard} ${expanded ? styles.shardExpanded : ''}`}>
      <button
        type='button'
        className={styles.shardHeader}
        onClick={handleToggle}
        aria-expanded={expanded}
        aria-controls={bodyId}
        aria-label={expandLabel}>
        <span className={styles.shardChevron} aria-hidden='true'>
          <Chevron size={14} />
        </span>
        <span className={styles.shardHeading}>{shard.heading}</span>
        <span className={styles.shardCategory}>{categoryLabel}</span>
        {shard.bpCost !== undefined && (
          <span className={styles.shardBpBadge}>
            {shard.bpCost} {t('bpUnit')}
          </span>
        )}
        {shard.level !== undefined && (
          <span className={styles.shardLevelBadge}>
            {tCommon('levelShort', { level: shard.level })}
          </span>
        )}
      </button>
      {displayAspects(shard.tags).length > 0 && (
        <div className={styles.shardAspects}>
          <AspectGlyphs tags={shard.tags} />
        </div>
      )}

      {expanded && (
        <div className={styles.shardBody}>
          <ContentExpandBody
            contentType={(preview?.kind ?? 'feats') as ContentShardType}
            contentSlug={preview?.slug ?? shard.id}
            contentKey={shard.heading}
            cachedText={shard.cachedText}
            id={bodyId}
          />
        </div>
      )}
    </div>
  );
};
