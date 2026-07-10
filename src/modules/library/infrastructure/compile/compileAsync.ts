/**
 * @fileoverview Async-import flavor MDX compiler.
 * Dynamically imports evaluator and plugins in parallel to avoid bundling them
 * until runtime.
 * @module src/lib/mdx/compileAsync/compileAsync
 *
 * @author Typeir
 * @version 0.1.0
 * @since 2026-04-28
 */

import type { EvaluateOptions } from 'next-mdx-remote-client/rsc';
import type { CompileOptions } from '../../domain/compileOptions';
import { buildMdxOptions, importAllAsync } from './compileUtils';

/**
 * Compile MDX by dynamically importing evaluator + plugins in parallel.
 *
 * @param {CompileOptions} opts - Compilation options
 * @returns {Promise<Awaited<ReturnType<import('next-mdx-remote-client/rsc')['evaluate']>>>}
 */
export async function compileAsync(opts: CompileOptions) {
  const {
    source,
    components,
    mdxOptions,
    baseUrl,
    parseFrontmatter = true,
  } = opts;

  const {
    evaluate,
    remarkDiceRoll,
    remarkGfm,
    remarkMath,
    rehypeKatex,
    rehypeSectionize,
  } = await importAllAsync();

  const result = await evaluate({
    source,
    components: components as any,
    options: {
      parseFrontmatter,
      mdxOptions: buildMdxOptions(
        mdxOptions,
        {
          remarkPlugins: [remarkGfm, remarkMath, remarkDiceRoll],
          rehypePlugins: [rehypeKatex, rehypeSectionize],
        },
        baseUrl,
      ),
    } as unknown as EvaluateOptions,
  });

  return result;
}
