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

import { inlineReusables } from '@/lib/content/reusable/inlineReusables';
import { discoverReusables } from '@/lib/content/reusable/reusableRegistry';
import type { EvaluateOptions } from 'next-mdx-remote-client/rsc';
import path from 'path';
import type { CompileOptions } from '../../domain/compileOptions';
import { buildMdxOptions, importAllAsync } from './compileUtils';

/** Content root scanned for files that opt into reuse. */
const CONTENT_ROOT = path.join(process.cwd(), 'src/content');

/**
 * Compile MDX by dynamically importing evaluator + plugins in parallel.
 * Reusable regions are spliced in at source level so they compile as part of
 * this document, with this document's component map. Components inside a
 * region therefore stay interactive.
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
    remarkUnit,
    remarkGfm,
    remarkMath,
    rehypeKatex,
    rehypeSectionize,
  } = await importAllAsync();

  const registry = await discoverReusables(CONTENT_ROOT);
  const resolvedSource = inlineReusables(source, registry);

  const result = await evaluate({
    source: resolvedSource,
    components: components as any,
    options: {
      parseFrontmatter,
      mdxOptions: buildMdxOptions(
        mdxOptions,
        {
          remarkPlugins: [remarkGfm, remarkMath, remarkDiceRoll, remarkUnit],
          rehypePlugins: [rehypeKatex, rehypeSectionize],
        },
        baseUrl,
      ),
    } as unknown as EvaluateOptions,
  });

  return result;
}
