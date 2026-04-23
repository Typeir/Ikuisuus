/**
 * @fileoverview SEO module barrel export.
 *
 * Re-exports the public API of the `src/lib/seo/` module. Provides
 * utilities for building Next.js Metadata objects targeting Open Graph
 * and Twitter Card social previews for library content pages.
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

