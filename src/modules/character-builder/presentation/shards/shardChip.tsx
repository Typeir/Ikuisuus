/**
 * @fileoverview Shard Chip Component
 * @description Chip with a lazily-loaded async tooltip showing a compiled MDX
 * preview of the shard's description. Fetches content from
 * `/api/content-shards/{kind}/{slug}` on first hover; uses `cachedText` if
 * already available. Integrates `usePagePreview` so clicking the tooltip opens
 * the draggable library page panel.
 *
 * @module modules/character-builder/presentation/shards/shardChip
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { AsyncTooltip } from '@/lib/components/ui/asyncTooltip';
import type { ChipVariant } from '@/lib/components/ui/chip';
import { Chip } from '@/lib/components/ui/chip';
import { fetcher } from '@/lib/fetch/fetcher';
import { contentShardKey, urlForContentShard } from '@/lib/fetch/swrKeys';
import type { ContentShardResponse } from '@/lib/types/api';
import type { CharacterShard } from '@/lib/types/character';
import { shardToPreview } from '@/modules/character-builder/lib/utils/shardToPreview';
import { compileRuntimeSync } from '@/modules/library/infrastructure/compile/compileRuntime';
import { truncateMdxSource } from '@/lib/md/truncateMdx';
import { mdxComponents } from '@/modules/library/presentation';
import { useLocale } from 'next-intl';
import type { ReactNode } from 'react';
import { memo, useCallback, useMemo } from 'react';
import { unstable_serialize, useSWRConfig } from 'swr';
import { usePagePreview } from '../PagePreview/pagePreviewProvider';

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
 */
export interface ShardChipProps {
  shard: CharacterShard;
  color?: ShardChipColor;
  onRemove?: () => void;
}

/**
 * Chip with a lazily-fetched MDX preview tooltip.
 *
 * @component
 * @param {ShardChipProps} props - Component props
 * @param {CharacterShard} props.shard - The shard to display
 * @param {ShardChipColor} [props.color] - Border color tier; if omitted, inferred from `shard.category`
 * @param {() => void} [props.onRemove] - Optional remove handler
 * @returns {JSX.Element} Rendered shard chip
 */
const ShardChipImpl: React.FC<ShardChipProps> = ({
  shard,
  color,
  onRemove,
}) => {
  const locale = useLocale();
  const preview = usePagePreview();
  const { cache, mutate } = useSWRConfig();
  const previewData = useMemo(
    () => shardToPreview(shard.sourceFile),
    [shard.sourceFile],
  );
  const variant = color
    ? COLOR_TO_VARIANT[color]
    : CATEGORY_TO_VARIANT[shard.category];

/** Rendered characters a chip preview shows before it is cut. */
const PREVIEW_CHARS = 150;

  const fetchContent = useCallback(async (): Promise<ReactNode> => {
    let source: string;

    if (shard.cachedText) {
      const raw = shard.cachedText;
      source = truncateMdxSource(raw, {
        maxChars: PREVIEW_CHARS,
        ellipsis: true,
      }).source;
    } else if (previewData) {
      const key = contentShardKey(
        previewData.kind,
        previewData.slug,
        locale,
        true,
      );
      if (!key) return shard.heading;
      const cached = cache.get(unstable_serialize(key))?.data as
        | ContentShardResponse
        | undefined;
      let data: ContentShardResponse | undefined = cached;
      if (!data) {
        try {
          data = await mutate<ContentShardResponse>(
            key,
            fetcher<ContentShardResponse>(
              urlForContentShard(previewData.kind, previewData.slug, locale),
            ),
            { revalidate: false, populateCache: true },
          );
        } catch {
          return shard.heading;
        }
      }
      const raw = data?.shards.main ?? '';
      source = truncateMdxSource(raw, {
        maxChars: PREVIEW_CHARS,
        ellipsis: true,
      }).source;
      if (!source) return shard.heading;
    } else {
      return shard.heading;
    }

    try {
      return compileRuntimeSync({ source, components: mdxComponents }).content;
    } catch {
      return source;
    }
  }, [shard, previewData, locale, cache, mutate]);

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
      showDelay={250}
      showClickIcon={false}>
      <Chip
        label={shard.heading}
        variant={variant}
        onInfo={handleInfo}
        onRemove={onRemove}
      />
    </AsyncTooltip>
  );
};

export const ShardChip = memo(ShardChipImpl);
ShardChip.displayName = 'ShardChip';
