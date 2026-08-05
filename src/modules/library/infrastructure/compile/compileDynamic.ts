/**
 * @fileoverview Dynamic-import flavour MDX compiler.
 * Dynamically imports evaluator and plugins in parallel to avoid bundling them
 * until runtime. "Dynamic" refers to that deferred loading, not to JavaScript
 * asynchronicity — both compilers in this directory are async.
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
 * Compile MDX by dynamically importing evaluator + plugins in parallel.
 * Reusable regions are spliced in at source level so they compile as part of
 * this document, with this document's component map. Components inside a
 * region therefore stay interactive.
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
    aspectSections,
  } = opts;

  const {
    evaluate,
    remarkAspects,
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
            [remarkAspects, { sections: aspectSections }],
            remarkDiceRoll,
            remarkUnit,
          ],
          rehypePlugins: [rehypeKatex, rehypeSectionize],
        },
        baseUrl,
      ),
    } as unknown as EvaluateOptions,
  });

  return result;
}
