/**
 * @fileoverview Compiles MDX with file-scoped imports. Async. Used by library route.
 *
 * @module src/lib/mdx/compileStatic/compileStatic
 *
 * @author Typeir
 * @version 0.1.0
 * @since 2026-04-28
 */

import { resolveReusableSource } from '@/lib/content/reusable/resolveReusableSource';
import remarkAspect from '@/lib/md/remarkAspect';
import remarkDiceRoll from '@/lib/md/remarkDiceRoll';
import remarkUnit from '@/lib/md/remarkUnit';
import { evaluate, EvaluateOptions } from 'next-mdx-remote-client/rsc';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import type { CompileOptions } from '../../domain/compileOptions';
import { buildMdxOptions } from './compileUtils';
import rehypeAspects from './rehypeAspects';
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
    aspects,
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
            remarkAspect,
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
