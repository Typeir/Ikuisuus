/**
 * @fileoverview Dynamic MDX content page for the library.
 * @module app/[locale]/library/[...slug]/page
 *
 * Renders MDX/MD content files from the content directory using
 * next-mdx-remote-client for server-side compilation with client fallback.
 */

import { logger } from '@/lib/logging/logger';
import { Metadata } from 'next';
import { evaluate, EvaluateOptions } from 'next-mdx-remote-client/rsc';
import { notFound, redirect } from 'next/navigation';

import components, { HashNavigationProvider } from '@/lib/components/mdx';
import EditPageButton from '@/lib/components/mdxEditor/editPageButton';
import { isMdFile } from '@/lib/md/isMdFile';
import findAllMdxFiles from '@/lib/mdx/findAllMdxFiles';
import { fetchContent } from '@/lib/utils/fetchContent';
import path from 'path';
import remarkGfm from 'remark-gfm';
import { pathToFileURL } from 'url';
import ClientRenderer from '../../utils/clientRenderer';
import styles from './page.module.scss';
import { MDRawPage } from './utils/mdRawPage';

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
  const CONTENT_ROOT = path.join(process.cwd(), 'src', 'content', 'en');
  const mdxFiles = await findAllMdxFiles(CONTENT_ROOT);
  return mdxFiles.map((filePath) => {
    const relativePath = path.relative(CONTENT_ROOT, filePath);
    const slug = relativePath.replace(/\.mdx$/, '').split(path.sep);
    return { slug };
  });
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
 * Extracts the first H1 heading from MDX content.
 *
 * @param {string} content - Raw MDX content
 * @returns {string|null} H1 text or null if not found
 */
function extractH1FromMdx(content: string): string | null {
  // Match first H1: # Title or <h1>Title</h1>
  const mdH1Match = content.match(/^#\s+(.+)$/m);
  if (mdH1Match) return mdH1Match[1].trim();

  const htmlH1Match = content.match(/<h1[^>]*>(.+?)<\/h1>/i);
  if (htmlH1Match) return htmlH1Match[1].replace(/<[^>]*>/g, '').trim();

  return null;
}

/**
 * Generates metadata for the page, extracting title from MDX H1.
 *
 * @param {PageProps} props - Route params
 * @param {Promise<{ slug: string[], locale: string }>} props.params - Async route parameters
 * @returns {Promise<Metadata>} Page metadata
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;

  const slugSegments = slug[0] === locale ? slug.slice(1) : slug;
  const slugPath = slugSegments.join('/');

  const result = await fetchContent(locale, slugPath);

  if (!result) {
    return {
      title: 'Not Found | Library of Ikuisuus',
    };
  }

  try {
    const h1Title = extractH1FromMdx(result.content);

    if (h1Title) {
      return {
        title: `${h1Title} | Library of Ikuisuus`,
      };
    }
  } catch (error) {
    log.error('Error generating metadata', {
      error: error instanceof Error ? error.message : String(error),
      slugPath: slugSegments.join('/'),
      locale,
    });
  }

  // Fallback to slug-based title
  const fallbackTitle = slugSegments[slugSegments.length - 1]
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: `${fallbackTitle} | Library of Ikuisuus`,
  };
}

/**
 * Dynamic content page with fallback to ClientRenderer if MDX precompilation fails.
 *
 * @param {PageProps} props - Route params
 * @param {Promise<{ slug: string[], locale: string }>} props.params - Async route parameters
 * @returns {JSX.Element} Rendered page or fallback
 */
const Page = async ({ params }: PageProps) => {
  const { slug, locale } = await params;

  // Normalize slug: handle accidental locale duplication
  const slugSegments = slug[0] === locale ? slug.slice(1) : slug;
  const slugPath = slugSegments.join('/');

  let result = await fetchContent(locale, slugPath);

  // If the slug doesn't resolve, try redirecting to slug/main
  if (!result) {
    const mainResult = await fetchContent(locale, `${slugPath}/main`);

    if (mainResult) {
      redirect(`/${locale}/library/${slugPath}/main`);
    }

    notFound();
  }

  const { content: rawContent, resolvedPath } = result;

  // Render raw .md as-is
  if (isMdFile(resolvedPath)) {
    return <MDRawPage slugPath={slugPath} rawContent={rawContent} />;
  }

  // Try to precompile MDX via `evaluate`
  let evalResult;

  try {
    // pathToFileURL requires an absolute path; use a placeholder for GitHub-sourced content
    const baseUrl = path.isAbsolute(resolvedPath)
      ? pathToFileURL(resolvedPath).toString()
      : undefined;

    evalResult = await evaluate({
      source: rawContent,
      components,
      options: {
        parseFrontmatter: true,
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          ...(baseUrl ? { baseUrl } : {}),
        },
      } as unknown as EvaluateOptions,
    });
  } catch (error) {
    log.warning(
      'Catastrophic error when parsing MDX, falling back to client renderer',
      {
        error: error instanceof Error ? error.message : String(error),
        slugPath,
      },
    );
  } finally {
    if (!evalResult || evalResult.error) {
      log.warning('MDX precompilation failed, falling back to ClientRenderer', {
        slugPath,
        error: evalResult?.error ? String(evalResult.error) : 'Unknown error',
      });
      return (
        <div className='prose prose-invert mx-auto'>
          <h1 className='text-4xl font-mono font-black mb-6'>{slugPath}</h1>
          <article className={styles.markdown}>
            <ClientRenderer locale={locale} slug={slugPath} />
          </article>
          <EditPageButton slug={slugPath} locale={locale} />
        </div>
      );
    }
  }

  const { content, frontmatter } = evalResult;

  return (
    <div className='prose prose-invert mx-auto'>
      <HashNavigationProvider />
      <article className={styles.markdown}>{content}</article>
      <EditPageButton slug={slugPath} locale={locale} />
    </div>
  );
};

export default Page;

export const dynamic = 'force-static';
