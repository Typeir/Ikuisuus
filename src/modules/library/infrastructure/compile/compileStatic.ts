/**
 * @fileoverview Synchronous-import flavor MDX compiler.
 * Uses file-scoped (static) imports so bundlers include the evaluator at build time.
 * @description "Static" refers to the page being built statically, not to
 * JavaScript synchronicity — this function is async and must be awaited. It is
 * the compiler the library route uses, so anything that must reach a rendered
 * page has to be wired here.
 *
 * @module src/lib/mdx/compileStatic/compileStatic
 *
 * @author Typeir
 * @version 0.1.0
 * @since 2026-04-28
 */

import { resolveReusableSource } from '@/lib/content/reusable/resolveReusableSource';
import remarkDiceRoll from '@/lib/md/remarkDiceRoll';
import remarkUnit from '@/lib/md/remarkUnit';
import { evaluate, EvaluateOptions } from 'next-mdx-remote-client/rsc';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import type { CompileOptions } from '../../domain/compileOptions';
import { buildMdxOptions } from './compileUtils';
import rehypeSectionize from './rehypeSectionize';

/**
 * Compile MDX using file-wide (static) imports.
 *
 * @param {CompileOptions} opts
 * @returns {Promise<Awaited<ReturnType<typeof evaluate>>>}
 */
export async function compileStatic(opts: CompileOptions) {
  const {
    source,
    components,
    mdxOptions,
    baseUrl,
    parseFrontmatter = true,
  } = opts;

  const resolvedSource = await resolveReusableSource(source);

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
