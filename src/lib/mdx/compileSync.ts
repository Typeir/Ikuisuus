/**
 * @fileoverview Synchronous-import flavor MDX compiler.
 * Uses file-scoped (static) imports so bundlers include the evaluator at build time.
 * @module src/lib/mdx/compileSync/compileSync
 *
 * @author Typeir
 * @version 0.1.0
 * @since 2026-04-28
 */

import { buildMdxOptions, CompileOptions } from '@/lib/mdx/compileUtils';
import rehypeSectionize from '@/lib/mdx/rehypeSectionize';
import { evaluate, EvaluateOptions } from 'next-mdx-remote-client/rsc';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

/**
 * Compile MDX using file-wide (static) imports.
 *
 * @param {CompileOptions} opts
 * @returns {Promise<Awaited<ReturnType<typeof evaluate>>>}
 */
export async function compileSync(opts: CompileOptions) {
  const {
    source,
    components,
    mdxOptions,
    baseUrl,
    parseFrontmatter = true,
  } = opts;

  const result = await evaluate({
    source,
    components: components as any,
    options: {
      parseFrontmatter,
      mdxOptions: buildMdxOptions(
        mdxOptions,
        {
          remarkPlugins: [remarkGfm, remarkMath],
          rehypePlugins: [rehypeKatex, rehypeSectionize],
        },
        baseUrl,
      ),
    } as unknown as EvaluateOptions,
  });

  return result;
}
