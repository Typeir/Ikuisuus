/**
 * @fileoverview Barrel export for the `src/lib/seo/` module.
 * Re-exports utilities for building Next.js Metadata objects for Open Graph
 * and Twitter Card social previews.
 *
 * @module lib/seo
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

export { buildPageMetadata } from './buildPageMetadata';
export { extractDescriptionFromMdx } from './extractDescription';
export { resolveMetadataBase } from './resolveMetadataBase';
export { resolvePageImage } from './resolvePageImage';
export type { PageSeoInput } from './types';

