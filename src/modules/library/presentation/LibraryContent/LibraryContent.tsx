/**
 * @fileoverview Library Content Body
 * @description Resolves a library slug and renders the compiled article. Shared
 * by the `/{locale}/library/...` and `/{locale}/embed/...` route trees. `basePath`
 * carries the originating tree down to content resolution.
 *
 * @module modules/library/presentation/LibraryContent/LibraryContent
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import ClientRenderer from '@/app/[locale]/utils/clientRendererLazy';
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
import { KeywordShardProvider } from '../components/Keyword/KeywordShardContext';
import { LibraryArticle } from '../LibraryArticle';
import { MdRawPage } from '../MdRawPage';

const log = logger.child({ module: 'LibraryContent' });

/**
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
 * Resolves and renders one library article. Redirects when the slug resolves
 * only via its `main` child, 404s when nothing resolves, renders raw markdown
 * through `<MdRawPage>`, and falls back to the client renderer when MDX
 * compilation fails.
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
        <LibraryArticle
          containerClassName='mx-auto'
          titleAction={
            <EditPageButton slug={resolved.slugPath} locale={locale} />
          }>
          <ClientRenderer locale={locale} slug={resolved.slugPath} />
        </LibraryArticle>
      </div>
    );
  }

  return (
    <DraftOverlay locale={locale} slug={resolved.slugPath}>
      <HashNavigationProvider />
      <SectionTrack />
      <ArticleMetadataProvider metadata={resolved.articleMetadata}>
        <LibraryArticle
          streamText={resolved.streamText}
          titleAction={
            <EditPageButton slug={resolved.slugPath} locale={locale} />
          }>
          <KeywordShardProvider shards={resolved.shards ?? []}>
            {resolved.evalResult.content}
          </KeywordShardProvider>
        </LibraryArticle>
      </ArticleMetadataProvider>
    </DraftOverlay>
  );
};
