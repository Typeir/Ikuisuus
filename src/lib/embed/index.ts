/**
 * @fileoverview Embed module barrel
 * @module src/lib/embed/index
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

export { classifyEmbedLink, type EmbedLinkAction } from './classifyEmbedLink';
export { EmbedLinkBridge } from './EmbedLinkBridge';
export {
  buildEmbedUrl,
  isEmbedPathname,
  isLibraryPathname,
  toEmbedPathname,
  toLibraryPathname,
} from './embedRoutes';
