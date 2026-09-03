/**
 * @fileoverview MDX compiler that imports its evaluator and plugins at runtime
 * via dynamic imports.
 * @module src/modules/library/infrastructure/compile/compileDynamic
 *
 * @author Typeir
 * @version 0.1.0
 * @since 2026-04-28
 */

import { resolveReusableSource } from '@/lib/content/reusable/resolveReusableSource';
import { DEFAULT_KEYWORD_LOCALE } from '@/lib/constants/locales';
import { resolveDocumentKeywords } from '@/lib/md/resolveShardByRef';
import desugarSlotAttributes from '@/lib/md/desugarSlotAttributes';
import { BLOCK_COMPONENTS, SLOT_HOSTS } from '@/modules/library/domain/slots';
import type { EvaluateOptions } from 'next-mdx-remote-client/rsc';
import type { CompileOptions } from '../../domain/compileOptions';
import { buildMdxOptions, importAllAsync } from './compileUtils';

/**
 * Splices reusable regions into the source at text level, then compiles the
 * resulting MDX with dynamically imported evaluator and plugins.
 *
 * @param {CompileOptions} opts - Compilation options
 * @returns {Promise<Awaited<ReturnType<import('next-mdx-remote-client/rsc')['evaluate']>>>}
 */
export async function compileDynamic(opts: CompileOptions) {
  const {
    source,
    components,
    mdxOptions,
    baseUrl,
    parseFrontmatter = true,
    aspects,
  } = opts;

  const {
    evaluate,
    rehypeAspects,
    remarkAspect,
    remarkDiceRoll,
    remarkUnit,
    remarkKeyword,
    remarkLibraryLink,
    remarkGfm,
    remarkMath,
    rehypeKatex,
    rehypeSectionize,
  } = await importAllAsync();

  const locale = opts.locale ?? DEFAULT_KEYWORD_LOCALE;
  const resolvedSource = await resolveReusableSource(source);
  const { shards, resolutions } = await resolveDocumentKeywords(
    resolvedSource,
    locale,
  );

  const result = await evaluate({
    source: resolvedSource,
    components: components as any,
    options: {
      parseFrontmatter,
      mdxOptions: buildMdxOptions(
        mdxOptions,
        {
          remarkPlugins: [
            [desugarSlotAttributes, { hosts: SLOT_HOSTS }],
            [remarkLibraryLink, { locale }],
            remarkGfm,
            remarkMath,
            remarkAspect,
            remarkDiceRoll,
            remarkUnit,
            [remarkKeyword, { resolutions }],
          ],
          rehypePlugins: [
            rehypeKatex,
            [rehypeSectionize, { entryComponents: BLOCK_COMPONENTS }],
            [rehypeAspects, aspects],
          ],
        },
        baseUrl,
      ),
    } as unknown as EvaluateOptions,
  });

  return { ...result, shards };
}
