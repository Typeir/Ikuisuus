/**
 * @fileoverview Resolves library route content and compiles MDX when needed.
 * @module modules/library/application/use-cases/resolveAndCompileContent
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import { resolveStreamText } from '@/lib/machineText';
import { isMdFile } from '@/lib/md/isMdFile';
import { compileSync } from '@/modules/library/infrastructure/compile/compileSync';
import { fetchContent } from '@/modules/library/infrastructure/content/fetchContent';
import components from '@/modules/library/presentation/components';
import type { EvaluateResult } from 'next-mdx-remote-client/rsc';
import path from 'path';
import { pathToFileURL } from 'url';

/**
 * Route params for content resolution.
 */
export interface ResolveAndCompileParams {
  slug: string[];
  locale: string;
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
  evalResult?: EvaluateResult;
  compileError?: unknown;
}

/**
 * Redirect payload when slug/main exists.
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
 * @returns {Promise<ResolveAndCompileResult>} Route resolution outcome.
 */
export async function resolveAndCompileContent({
  slug,
  locale,
}: ResolveAndCompileParams): Promise<ResolveAndCompileResult> {
  const slugSegments = (slug[0] === locale ? slug.slice(1) : slug).map(
    (segment) => decodeURIComponent(segment),
  );
  const slugPath = slugSegments.join('/');

  const result = await fetchContent(locale, slugPath);

  if (!result) {
    const mainResult = await fetchContent(locale, `${slugPath}/main`);

    if (mainResult) {
      return {
        kind: 'redirect',
        href: `/${locale}/library/${slugPath}/main`,
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

  try {
    const baseUrl = path.isAbsolute(resolvedPath)
      ? pathToFileURL(resolvedPath).toString()
      : undefined;

    const evalResult = await compileSync({
      source: rawContent,
      components,
      baseUrl,
      parseFrontmatter: true,
    });

    return {
      kind: 'mdx',
      slugPath,
      rawContent,
      streamText,
      evalResult,
    };
  } catch (compileError) {
    return {
      kind: 'mdx',
      slugPath,
      rawContent,
      streamText,
      compileError,
    };
  }
}
