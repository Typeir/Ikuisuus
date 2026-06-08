/**
 * @fileoverview Barrel exports for MDX source extraction helpers.
 * @module modules/library/infrastructure/content/mdxSource
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import type { FeatureEntry } from '@/lib/types/vocations';

export { buildShardsFromSource } from './buildShardsFromSource';
export { extractFirstParagraph } from './extractFirstParagraph';
export { extractHeadingBlock } from './extractHeadingBlock';
export { fetchSource } from './fetchSource';
export { stripContentPrefix } from './stripContentPrefix';
export type { FeatureEntry };

