/**
 * @fileoverview Builds character shards from source MDX feature headings.
 * @module modules/library/infrastructure/content/buildShardsFromSource
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import type { CharacterShard } from '@/lib/types/character';
import type { FeatureEntry } from '@/lib/types/vocations';
import { extractFirstParagraph } from './extractFirstParagraph';
import { extractHeadingBlock } from './extractHeadingBlock';

/**
 * Builds shard previews from source text and feature definitions.
 *
 * @param {string} slug - Source entity slug.
 * @param {string} sourceFile - Relative source file path.
 * @param {string} content - Raw MDX source.
 * @param {FeatureEntry[]} features - Features with heading metadata.
 * @param {CharacterShard['category']} category - Shard category.
 * @returns {CharacterShard[]} Character shards with cached preview text.
 */
export function buildShardsFromSource(
  slug: string,
  sourceFile: string,
  content: string,
  features: FeatureEntry[],
  category: CharacterShard['category'],
): CharacterShard[] {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');

  return features.map((feature) => {
    let cachedText: string | undefined;

    if (feature.startLine !== undefined && feature.endLine !== undefined) {
      const block = lines
        .slice(feature.startLine - 1, feature.endLine)
        .join('\n');
      cachedText = extractFirstParagraph(block);
    } else {
      const block = extractHeadingBlock(normalized, feature.name);
      cachedText = block ? extractFirstParagraph(block) : undefined;
    }

    return {
      id: `${slug}::${feature.level}::${feature.name}`,
      sourceFile,
      heading: feature.name,
      category,
      level: feature.level,
      cachedText,
    };
  });
}
