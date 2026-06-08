/**
 * @fileoverview Shared helpers for MDX compilation modules.
 * @module src/lib/mdx/compileUtils
 *
 * @author Typeir
 * @version 0.1.0
 * @since 2026-04-28
 */

import type {
    CompileOptions,
    EvaluateMdxOptions,
} from '../../domain/compileOptions';

export type { CompileOptions };

/**
 * Merge default plugin lists with user-supplied mdxOptions and optional baseUrl.
 * Expects plugin values to be the actual plugin functions (not module objects).
 *
 * @param {EvaluateMdxOptions | undefined} mdxOptions - incoming options
 * @param {object} defaults - default plugin modules
 * @param {string | undefined} baseUrl - optional baseUrl to include
 * @returns {EvaluateMdxOptions} merged options
 */
export function buildMdxOptions(
  mdxOptions: EvaluateMdxOptions | undefined,
  defaults: {
    remarkPlugins?: unknown[];
    rehypePlugins?: unknown[];
  },
  baseUrl?: string,
): EvaluateMdxOptions {
  const remarkPlugins = [
    ...(defaults.remarkPlugins ?? []),
    ...(Array.isArray(mdxOptions?.remarkPlugins)
      ? mdxOptions!.remarkPlugins
      : []),
  ].filter(Boolean);

  const rehypePlugins = [
    ...(defaults.rehypePlugins ?? []),
    ...(Array.isArray(mdxOptions?.rehypePlugins)
      ? mdxOptions!.rehypePlugins
      : []),
  ].filter(Boolean);

  const merged: EvaluateMdxOptions = {
    ...(mdxOptions ?? {}),
    remarkPlugins,
    rehypePlugins,
    ...(baseUrl ? { baseUrl } : {}),
  } as EvaluateMdxOptions;

  return merged;
}

/**
 * Dynamically import common MDX-related modules in parallel.
 * Returns normalized exports (use `.default` when appropriate).
 */
export async function importAllAsync() {
  const [
    mdxRemote,
    remarkGfmMod,
    remarkMathMod,
    rehypeKatexMod,
    rehypeSectionizeMod,
  ] = await Promise.all([
    import('next-mdx-remote-client/rsc'),
    import('remark-gfm'),
    import('remark-math'),
    import('rehype-katex'),
    import('./rehypeSectionize'),
  ]);

  return {
    evaluate: mdxRemote.evaluate,
    remarkGfm: (remarkGfmMod as any).default ?? remarkGfmMod,
    remarkMath: (remarkMathMod as any).default ?? remarkMathMod,
    rehypeKatex: (rehypeKatexMod as any).default ?? rehypeKatexMod,
    rehypeSectionize:
      (rehypeSectionizeMod as any).default ?? rehypeSectionizeMod,
  };
}
