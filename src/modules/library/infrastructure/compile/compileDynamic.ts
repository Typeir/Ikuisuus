/**
 * @fileoverview MDX compiler that imports its evaluator and plugins at runtime
 * via dynamic imports.
 * @module src/lib/mdx/compileDynamic/compileDynamic
 *
 * @author Typeir
 * @version 0.1.0
 * @since 2026-04-28
 */

import { resolveReusableSource } from '@/lib/content/reusable/resolveReusableSource';
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
    remarkDiceRoll,
    remarkUnit,
    remarkGfm,
    remarkMath,
    rehypeKatex,
    rehypeSectionize,
  } = await importAllAsync();

  const resolvedSource = await resolveReusableSource(source);

  const result = await evaluate({
    source: resolvedSource,
    components: components as any,
    options: {
      parseFrontmatter,
      mdxOptions: buildMdxOptions(
        mdxOptions,
        {
          remarkPlugins: [
            remarkGfm,
            remarkMath,
            remarkDiceRoll,
            remarkUnit,
          ],
          rehypePlugins: [rehypeKatex, rehypeSectionize, [rehypeAspects, aspects]],
        },
        baseUrl,
      ),
    } as unknown as EvaluateOptions,
  });

  return result;
}
