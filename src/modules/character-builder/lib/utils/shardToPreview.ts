/**
 * @fileoverview Shard to Preview Utilities
 * @description Utilities for extracting preview kind and slug from CharacterShard sourceFile paths.
 *
 * @module modules/character-builder/lib/utils/shardToPreview
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { PreviewKind } from '@/modules/character-builder/presentation/PagePreview/pagePreviewProvider';
import { MAIN_INDEX_FILE } from '@/lib/enums/constants';

/**
 * Preview entry data extracted from a shard.
 *
 * @interface ShardPreviewData
 * @property {PreviewKind} kind - Library kind
 * @property {string} slug - Page slug
 */
export interface ShardPreviewData {
  kind: PreviewKind;
  slug: string;
}

/**
 * Extract preview kind and slug from a CharacterShard sourceFile path.
 *
 * Handles patterns like:
 * - `character-creation/bloodlines/empyrean.bloodline.mdx` → { kind: 'bloodlines', slug: 'empyrean' }
 * - `character-creation/vocations/wizard/main.mdx` → { kind: 'vocations', slug: 'wizard' }
 * - `character-creation/specializations/evocation/main.mdx` → { kind: 'specializations', slug: 'evocation' }
 * - `feats/fireball.feat.mdx` → { kind: 'feats', slug: 'fireball' }
 *
 * @function shardToPreview
 * @param {string} sourceFile - Relative path from `src/content/en/`
 * @returns {ShardPreviewData | null} Preview data, or null if pattern not recognized
 */
export function shardToPreview(sourceFile: string): ShardPreviewData | null {
  const parts = sourceFile.split('/');
  if (parts.length < 2) return null;

  const lastSegment = parts[parts.length - 1];

  if (isBoodlinePattern(parts, lastSegment)) {
    const slug = lastSegment.replace(/\.bloodline\.mdx$/, '');
    return { kind: 'bloodlines', slug };
  }

  if (isVocationPattern(parts, lastSegment)) {
    const slug = parts[2];
    return { kind: 'vocations', slug };
  }

  if (isSpecializationPattern(parts, lastSegment)) {
    const slug = parts[2];
    return { kind: 'specializations', slug };
  }

  if (isFeatPattern(parts, lastSegment)) {
    const slug = lastSegment.replace(/\.mdx$/, '');
    return { kind: 'feats', slug };
  }

  return null;
}

/**
 * Check if sourceFile matches bloodline pattern.
 * Pattern: character-creation/bloodlines/slug.bloodline.mdx
 *
 * @function isBoodlinePattern
 * @param {string[]} parts - Split path parts
 * @param {string} lastSegment - Last path segment
 * @returns {boolean} Whether pattern matches
 */
function isBoodlinePattern(parts: string[], lastSegment: string): boolean {
  return (
    parts[0] === 'character-creation' &&
    parts[1] === 'bloodlines' &&
    lastSegment.endsWith('.bloodline.mdx')
  );
}

/**
 * Check if sourceFile matches vocation pattern.
 * Pattern: character-creation/vocations/slug/main.mdx
 *
 * @function isVocationPattern
 * @param {string[]} parts - Split path parts
 * @param {string} lastSegment - Last path segment
 * @returns {boolean} Whether pattern matches
 */
function isVocationPattern(parts: string[], lastSegment: string): boolean {
  return (
    parts[0] === 'character-creation' &&
    parts[1] === 'vocations' &&
    lastSegment === MAIN_INDEX_FILE &&
    parts.length === 4
  );
}

/**
 * Check if sourceFile matches specialization pattern.
 * Pattern: character-creation/specializations/slug/main.mdx
 *
 * @function isSpecializationPattern
 * @param {string[]} parts - Split path parts
 * @param {string} lastSegment - Last path segment
 * @returns {boolean} Whether pattern matches
 */
function isSpecializationPattern(
  parts: string[],
  lastSegment: string,
): boolean {
  return (
    parts[0] === 'character-creation' &&
    parts[1] === 'specializations' &&
    lastSegment === MAIN_INDEX_FILE &&
    parts.length === 4
  );
}

/**
 * Check if sourceFile matches feat pattern.
 * Pattern: character-creation/feats/slug.mdx
 *
 * @function isFeatPattern
 * @param {string[]} parts - Split path parts
 * @param {string} lastSegment - Last path segment
 * @returns {boolean} Whether pattern matches
 */
function isFeatPattern(parts: string[], lastSegment: string): boolean {
  return (
    parts[0] === 'character-creation' &&
    parts[1] === 'feats' &&
    lastSegment.endsWith('.mdx') &&
    parts.length === 3
  );
}
