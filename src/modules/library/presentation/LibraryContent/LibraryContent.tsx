/**
 * @fileoverview Library Content Body
 * @description Resolves a library slug and renders the compiled article. Shared
 * by the two route trees that serve the same content: `/{locale}/library/...`
 * with the full wiki chrome, and `/{locale}/embed/...` without it.
 *
 * The trees differ only in the shell the layout wraps around this body, so the
 * body itself lives here once. `basePath` travels down to content resolution so
 * a `slug` → `slug/main` redirect lands back in the tree the request came from.
 *
 * @module modules/library/presentation/LibraryContent/LibraryContent
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import ClientRenderer from '@/app/[locale]/utils/clientRendererLazy';
import StreamBootstrap from '@/lib/components/stream/StreamBootstrap';
import { logger } from '@/lib/logging/logger';
import { ArticleMetadataProvider } from '@/modules/library/application/context/ArticleMetadataContext';
import {
  resolveAndCompileContent,
  type LibraryBasePath,
} from '@/modules/library/application/use-cases';
import { DraftOverlay, EditPageButton } from '@/modules/mdx-editor';
import { notFound, redirect } from 'next/navigation';
import type { JSX } from 'react';
import { HashNavigationProvider, SectionTrack } from '../components';
import { LibraryArticle } from '../LibraryArticle';
import { MdRawPage } from '../MdRawPage';

const log = logger.child({ module: 'LibraryContent' });

/**
 * Props for `<LibraryContent>`.
 *
 * @interface LibraryContentProps
 * @property {string[]} slug - Route slug segments beneath the locale
 * @property {string} locale - Active locale code
 * @property {LibraryBasePath} [basePath='library'] - Route tree this render belongs to
 */
export interface LibraryContentProps {
  slug: string[];
  locale: string;
  basePath?: LibraryBasePath;
}

/**
 * Resolves and renders one library article.
 *
 * Redirects when the slug resolves only via its `main` child, 404s when nothing
 * resolves, renders raw markdown through `<MdRawPage>`, and falls back to the
 * client renderer when server-side MDX compilation fails.
 *
 * @component
 * @param {LibraryContentProps} props - Component props
 * @param {string[]} props.slug - Route slug segments beneath the locale
 * @param {string} props.locale - Active locale code
 * @param {LibraryBasePath} [props.basePath='library'] - Route tree this render belongs to
 * @returns {Promise<JSX.Element>} The rendered article
 */
export const LibraryContent = async ({
  slug,
  locale,
  basePath = 'library',
}: LibraryContentProps): Promise<JSX.Element> => {
  const resolved = await resolveAndCompileContent({ slug, locale, basePath });

  if (resolved.kind === 'redirect') {
    redirect(resolved.href);
  }

  if (resolved.kind === 'not-found') {
    notFound();
  }

  if (resolved.kind === 'md') {
    return (
      <MdRawPage
        slugPath={resolved.slugPath}
        rawContent={resolved.rawContent}
      />
    );
  }

  if (!resolved.evalResult || resolved.evalResult.error) {
    log.warning('MDX precompilation failed, falling back to ClientRenderer', {
      slugPath: resolved.slugPath,
      error: resolved.evalResult?.error
        ? String(resolved.evalResult.error)
        : resolved.compileError
          ? String(resolved.compileError)
          : 'Unknown error',
    });

    return (
      <div className='prose prose-invert mx-auto'>
        <h1 className='text-4xl font-mono font-black mb-6'>
          {resolved.slugPath}
        </h1>
        <LibraryArticle containerClassName='mx-auto'>
          <ClientRenderer locale={locale} slug={resolved.slugPath} />
        </LibraryArticle>
        <EditPageButton slug={resolved.slugPath} locale={locale} />
      </div>
    );
  }

  return (
    <DraftOverlay locale={locale} slug={resolved.slugPath}>
      <HashNavigationProvider />
      <SectionTrack />
      <ArticleMetadataProvider metadata={resolved.articleMetadata}>
        <LibraryArticle streamText={resolved.streamText}>
          {resolved.evalResult.content}
        </LibraryArticle>
      </ArticleMetadataProvider>
      <StreamBootstrap />
      <EditPageButton slug={resolved.slugPath} locale={locale} />
    </DraftOverlay>
  );
};
