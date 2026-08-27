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
import { bakeKeywordShards } from '@/lib/md/bakeKeywordShards';
import { keywordShardTemplates } from '@/modules/library/presentation/components/Keyword/KeywordShardTemplates';
import { resolveKeywordRegistry } from '@/lib/md/resolveKeywordRegistry';
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
    remarkGfm,
    remarkMath,
    rehypeKatex,
    rehypeSectionize,
  } = await importAllAsync();

  const keywords = await resolveKeywordRegistry();
  const { source: resolvedSource, shards } = await bakeKeywordShards(
    await resolveReusableSource(source),
    keywords,
  );
  const resolvedComponents = shards.length
    ? { ...components, KeywordShardTemplates: keywordShardTemplates(shards) }
    : components;

  const result = await evaluate({
    source: resolvedSource,
    components: resolvedComponents as any,
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
            [remarkKeyword, { registry: keywords }],
          ],
          rehypePlugins: [rehypeKatex, rehypeSectionize, [rehypeAspects, aspects]],
        },
        baseUrl,
      ),
    } as unknown as EvaluateOptions,
  });

  return result;
}
