/**
 * @fileoverview Resolves library route content and compiles MDX when needed.
 * @module modules/library/application/use-cases/resolveAndCompileContent
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import { stripContentSuffix } from '@/lib/constants/content';
import type { ResolvedShard } from '@/lib/types/api';
import { isMdFile } from '@/lib/md/isMdFile';
import type { ArticleMetadata } from '@/modules/library/application/context/ArticleMetadataContext';
import {
  aspectIndexOf,
  loadArticleMetadata,
} from '@/modules/library/application/use-cases/loadArticleMetadata';
import { compileStatic } from '@/modules/library/infrastructure/compile/compileStatic';
import { fetchContent } from '@/modules/library/infrastructure/content/fetchContent';
import components from '@/modules/library/presentation/components';
import { resolveStreamText } from '@/modules/library/presentation/components/utils';
import type { EvaluateResult } from 'next-mdx-remote-client/rsc';
import path from 'path';
import { pathToFileURL } from 'url';

/**
 * Route tree the resolved content is rendered under. Redirects stay in the same tree.
 */
export type LibraryBasePath = 'library' | 'embed';

/**
 * Route params for content resolution.
 */
export interface ResolveAndCompileParams {
  slug: string[];
  locale: string;
  basePath?: LibraryBasePath;
}

/**
 * Success payload for markdown content.
 */
export interface MarkdownResolution {
  kind: 'md';
  slugPath: string;
  rawContent: string;
}

/**
 * Success payload for compiled MDX content.
 */
export interface MdxResolution {
  kind: 'mdx';
  slugPath: string;
  rawContent: string;
  streamText: string;
  articleMetadata: ArticleMetadata | null;
  evalResult?: EvaluateResult;
  shards?: ResolvedShard[];
  compileError?: unknown;
}

/**
 * Redirect payload
 */
export interface RedirectResolution {
  kind: 'redirect';
  href: string;
}

/**
 * Not-found payload.
 */
export interface NotFoundResolution {
  kind: 'not-found';
}

/**
 * Union result for route content resolution.
 */
export type ResolveAndCompileResult =
  | MarkdownResolution
  | MdxResolution
  | RedirectResolution
  | NotFoundResolution;

/**
 * Resolves route content and compiles MDX where applicable.
 *
 * @param {ResolveAndCompileParams} params - Route resolution params.
 * @param {string[]} params.slug - Route slug segments.
 * @param {string} params.locale - Active locale.
 * @param {LibraryBasePath} [params.basePath='library'] - Route tree redirects should stay inside.
 * @returns {Promise<ResolveAndCompileResult>} Route resolution outcome.
 */
export async function resolveAndCompileContent({
  slug,
  locale,
  basePath = 'library',
}: ResolveAndCompileParams): Promise<ResolveAndCompileResult> {
  const slugSegments = (slug[0] === locale ? slug.slice(1) : slug).map(
    (segment) => decodeURIComponent(segment),
  );
  const slugPath = slugSegments.join('/');

  const bareSegments = slugSegments.map((segment, index) =>
    index === slugSegments.length - 1 ? stripContentSuffix(segment) : segment,
  );
  const barePath = bareSegments.join('/');

  if (barePath !== slugPath) {
    return { kind: 'redirect', href: `/${locale}/${basePath}/${barePath}` };
  }

  const result = await fetchContent(locale, slugPath);

  if (!result) {
    const mainResult = await fetchContent(locale, `${slugPath}/main`);

    if (mainResult) {
      return {
        kind: 'redirect',
        href: `/${locale}/${basePath}/${slugPath}/main`,
      };
    }

    return { kind: 'not-found' };
  }

  const { content: rawContent, resolvedPath } = result;

  if (isMdFile(resolvedPath)) {
    return {
      kind: 'md',
      slugPath,
      rawContent,
    };
  }

  const streamText = await resolveStreamText(locale, slugSegments, rawContent);
  const articleMetadata = await loadArticleMetadata(slugSegments, locale);

  try {
    const baseUrl = path.isAbsolute(resolvedPath)
      ? pathToFileURL(resolvedPath).toString()
      : undefined;

    const evalResult = await compileStatic({
      source: rawContent,
      components,
      baseUrl,
      parseFrontmatter: true,
      aspects: aspectIndexOf(articleMetadata),
      locale,
    });

    return {
      kind: 'mdx',
      slugPath,
      rawContent,
      streamText,
      articleMetadata,
      evalResult,
      shards: (evalResult as { shards?: ResolvedShard[] }).shards,
    };
  } catch (compileError) {
    return {
      kind: 'mdx',
      slugPath,
      rawContent,
      streamText,
      articleMetadata,
      compileError,
    };
  }
}
