/**
 * @fileoverview Compiles MDX with file-scoped (static) imports.
 * Async; must be awaited. Used by the library route.
 * @description Compiles MDX with file-scoped (static) imports so bundlers
 * include the evaluator at build time.
 *
 * @module src/lib/mdx/compileStatic/compileStatic
 *
 * @author Typeir
 * @version 0.1.0
 * @since 2026-04-28
 */

import { resolveReusableSource } from '@/lib/content/reusable/resolveReusableSource';
import remarkAspects from '@/lib/md/remarkAspects';
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
    aspectSections,
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
