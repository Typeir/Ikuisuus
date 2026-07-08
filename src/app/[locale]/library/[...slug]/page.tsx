/**
 * @fileoverview Dynamic MDX content page for the library.
 * @module app/[locale]/library/[...slug]/page
 *
 * Renders MDX/MD content files from the content directory using
 * next-mdx-remote-client for server-side compilation with client fallback.
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { logger } from '@/lib/logging/logger';
import {
  buildLibraryMetadata,
  generateLibraryStaticParams,
  resolveAndCompileContent,
} from '@/modules/library/application/use-cases';
import {
  HashNavigationProvider,
  LibraryArticle,
  MdRawPage,
  SectionTrack,
} from '@/modules/library/presentation';
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import StreamBootstrap from '@/lib/components/stream/StreamBootstrap';
import { DraftOverlay, EditPageButton } from '@/modules/mdx-editor';
import ClientRenderer from '../../utils/clientRenderer';

const log = logger.child({ module: 'LibraryPage' });

/**
 * Generates all static params for dynamic `[...slug]` route.
 *
 * Next.js uses this at build time to statically generate all MDX pages.
 *
 * @returns {Promise<Array<{ slug: string[] }>>} Array of slug params.
 */
export async function generateStaticParams(): Promise<
  Array<{ slug: string[] }>
> {
  return generateLibraryStaticParams();
}
/**
 * Props for the dynamic content route.
 */
type PageProps = {
  params: Promise<{
    slug: string[];
    locale: string;
  }>;
};

/**
 * Generates full SEO metadata for the page.
 *
 * Title resolution order: frontmatter `title` → first MDX H1 → slug-derived title.
 * Description resolution order: frontmatter `description` → first prose paragraph.
 * Image resolution order: frontmatter `image` → slug-derived public file → `.webp` candidate.
 *
 * @param {PageProps} props - Route params
 * @param {Promise<{ slug: string[], locale: string }>} props.params - Async route parameters
 * @returns {Promise<Metadata>} Page metadata with openGraph and twitter sub-objects.
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;

  try {
    return await buildLibraryMetadata({ slug, locale });
  } catch (error) {
    log.error('Error generating metadata', {
      error: error instanceof Error ? error.message : String(error),
      slug,
      locale,
    });

    return {
      title: 'Library of Ikuisuus',
    };
  }
}

/**
 * Dynamic content page with fallback to ClientRenderer if MDX precompilation fails.
 * Normalizes slugs: handles accidental locale duplication, decodes percent-encoded Unicode
 * If the slug doesn't resolve, tries redirecting to slug/main
 * Renders raw MD content with a simple component if the file isn't MDX
 * Precompiles MDX content with frontmatter support; falls back to ClientRenderer on errors
 * @param {PageProps} props - Route params
 * @param {Promise<{ slug: string[], locale: string }>} props.params - Async route parameters
 * @returns {JSX.Element} Rendered page or fallback
 */
const Page = async ({ params }: PageProps) => {
  const { slug, locale } = await params;

  const resolved = await resolveAndCompileContent({ slug, locale });

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
      <LibraryArticle streamText={resolved.streamText}>
        {resolved.evalResult.content}
      </LibraryArticle>
      <StreamBootstrap />
      <EditPageButton slug={resolved.slugPath} locale={locale} />
    </DraftOverlay>
  );
};

export default Page;

export const dynamic = 'force-static';
