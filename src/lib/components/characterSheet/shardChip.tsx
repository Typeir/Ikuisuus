/**
 * @fileoverview Shard Chip Component
 * @description Chip with a lazily-loaded async tooltip showing a compiled MDX
 * preview of the shard's description. Fetches content from
 * `/api/content-shards/{kind}/{slug}` on first hover; uses `cachedText` if
 * already available. Integrates `usePagePreview` so clicking the tooltip opens
 * the draggable library page panel.
 *
 * @module lib/components/characterSheet/shardChip
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { AsyncTooltip } from '@/lib/components/ui/asyncTooltip';
import { Chip } from '@/lib/components/ui/chip';
import type { ChipVariant } from '@/lib/components/ui/chip';
import { compileRuntimeSync } from '@/lib/mdx/compileRuntime';
import type { CharacterShard } from '@/lib/types/character';
import { shardToPreview } from '@/lib/utils/shardToPreview';
import type { ReactNode } from 'react';
import { useCallback } from 'react';
import { usePagePreview } from './pagePreviewProvider';

/**
 * Color tier for the shard chip border. Maps to existing CSS variable tokens.
 * - `primary` → `--color-accent` (boon tint)
 * - `secondary` → `--color-emphasis` (vocation tint)
 * - `tertiary` → `--color-actionable` (specialization tint)
 *
 * @typedef {'primary' | 'secondary' | 'tertiary'} ShardChipColor
 */
export type ShardChipColor = 'primary' | 'secondary' | 'tertiary';

/** @internal Maps color tier to Chip variant token */
const COLOR_TO_VARIANT: Record<ShardChipColor, ChipVariant> = {
  primary: 'boon',
  secondary: 'vocation-feature',
  tertiary: 'specialization-feature',
};

/** @internal Maps shard category to Chip variant token when no explicit color given */
const CATEGORY_TO_VARIANT: Record<CharacterShard['category'], ChipVariant> = {
  boon: 'boon',
  'vocation-feature': 'vocation-feature',
  'specialization-feature': 'specialization-feature',
  feat: 'feat',
};

/**
 * Props for `<ShardChip>`.
 *
 * @interface ShardChipProps
 * @property {CharacterShard} shard - The shard to display
 * @property {ShardChipColor} [color] - Border color tier; if omitted, inferred from `shard.category`
 * @property {() => void} [onRemove] - Optional remove handler
 * @property {string} [locale] - Content locale (default `en`)
 */
export interface ShardChipProps {
  shard: CharacterShard;
  color?: ShardChipColor;
  onRemove?: () => void;
  locale?: string;
}

/**
 * Chip with a lazily-fetched MDX preview tooltip.
 *
 * @component
 * @param {ShardChipProps} props - Component props
 * @returns {JSX.Element} Rendered shard chip
 */
export const ShardChip: React.FC<ShardChipProps> = ({
  shard,
  color,
  onRemove,
  locale = 'en',
}) => {
  const preview = usePagePreview();
  const previewData = shardToPreview(shard.sourceFile);
  const variant = color
    ? COLOR_TO_VARIANT[color]
    : CATEGORY_TO_VARIANT[shard.category];

  const fetchContent = useCallback(async (): Promise<ReactNode> => {
    let source: string;

    if (shard.cachedText) {
      source = shard.cachedText.slice(0, 150);
    } else if (previewData) {
      try {
        const res = await fetch(
          `/api/content-shards/${previewData.kind}/${previewData.slug}?keys[]=main&locale=${locale}`,
        );
        if (res.ok) {
          const data = (await res.json()) as { shards: Record<string, string> };
          source = (data.shards.main ?? '').slice(0, 150);
        } else {
          return shard.heading;
        }
      } catch {
        return shard.heading;
      }
    } else {
      return shard.heading;
    }

    try {
      return compileRuntimeSync({ source, components: {} }).content;
    } catch {
      return source;
    }
  }, [shard, previewData, locale]);

  const handleInfo = previewData
    ? () =>
        preview.open({
          kind: previewData.kind,
          slug: previewData.slug,
          title: shard.heading,
        })
    : undefined;

  return (
    <AsyncTooltip
      fetchContent={fetchContent}
      fallback={shard.heading}
      placement='top'
      showDelay={250}>
      <Chip
        label={shard.heading}
        variant={variant}
        onInfo={handleInfo}
        onRemove={onRemove}
      />
    </AsyncTooltip>
  );
};
