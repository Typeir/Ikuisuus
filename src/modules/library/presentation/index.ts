/**
 * @fileoverview Presentation exports for the library module.
 * @module modules/library/presentation
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

export {
    components, HashNavigationProvider, default as mdxComponents, SectionTrack, useHashNavigation
} from './components';
export { LibraryArticle } from './LibraryArticle';
export type { LibraryArticleProps } from './LibraryArticle';
/**
 * `LibraryContent` is deliberately absent. It resolves and compiles content,
 * which reaches the metadata repository and from there the ORM, and this barrel
 * is imported by client components â€” `contentShardPanel` pulls `mdxComponents`
 * from it. Re-exporting a server component here drags MikroORM and its native
 * sqlite driver into the browser bundle and fails the build.
 *
 * Routes import it from `./LibraryContent` directly.
 */
export type { LibraryContentProps } from './LibraryContent';
export { MdRawPage } from './MdRawPage';

