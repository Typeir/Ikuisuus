/**
 * @fileoverview Client-side MDX compiler. Hash-caches by source, async and sync separate.
 *
 * @module modules/library/infrastructure/compile/compileRuntime
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import remarkAspect from '@/lib/md/remarkAspect';
import remarkDiceRoll from '@/lib/md/remarkDiceRoll';
import remarkKeyword from '@/lib/md/remarkKeyword';
import remarkLibraryLink from '@/lib/md/remarkLibraryLink';
import remarkUnit from '@/lib/md/remarkUnit';
import { DEFAULT_KEYWORD_LOCALE } from '@/lib/constants/locales';
import { compile, compileSync, run, runSync } from '@mdx-js/mdx';
import { createElement, type ReactElement } from 'react';
import * as runtime from 'react/jsx-runtime';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import type { CompileOptions } from '../../domain/compileOptions';

/**
 * Result shape returned by all compile functions.
 *
 * @interface MdxCompileResult
 * @property {ReactElement} content - The compiled MDX rendered as a React element
 */
export interface MdxCompileResult {
  content: ReactElement;
}

/**
 * Compiled MDX component produced by `run`/`runSync`.
 */
type MdxContentComponent = React.FC<{ components?: unknown }>;

/**
 * Internal cache maps by source hash. Async and sync separate.
 */
const asyncCache = new Map<string, MdxContentComponent>();
const syncCache = new Map<string, MdxContentComponent>();

/**
 * Compute a simple hash of the source string for cache keying.
 *
 * @param {string} source - Source text to hash
 * @returns {string} Hash string
 */
function hashSource(source: string): string {
  let hash = 0;
  for (let i = 0; i < source.length; i++) {
    const char = source.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `h_${Math.abs(hash).toString(36)}`;
}

/**
 * Plugin options for a compile, bound to the locale whose routes shorthand
 * links expand into.
 *
 * @param {string} locale - Locale of the document being compiled
 * @returns {object} Options for `compile` and `compileSync`
 */
function pluginOptions(locale: string) {
  return {
    remarkPlugins: [
      [remarkLibraryLink, { locale }],
      remarkGfm,
      remarkMath,
      remarkAspect,
      remarkDiceRoll,
      remarkUnit,
      remarkKeyword,
    ],
    rehypePlugins: [rehypeKatex],
    outputFormat: 'function-body' as const,
  };
}

/**
 * Compile MDX client-side async using @mdx-js/mdx compile + run.
 * Results cached by source hash unless skipCache is set.
 *
 * @param {CompileOptions} opts - Compilation options
 * @param {boolean} [opts.skipCache=false] - Skip cache and force recompilation
 * @returns {Promise<MdxCompileResult>}
 */
export async function compileRuntime(
  opts: CompileOptions & { skipCache?: boolean },
): Promise<MdxCompileResult> {
  const { source, components, skipCache = false } = opts;
  const locale = opts.locale ?? DEFAULT_KEYWORD_LOCALE;
  const sourceHash = `${locale}:${hashSource(source)}`;

  let MDXContent = skipCache ? undefined : asyncCache.get(sourceHash);

  if (!MDXContent) {
    const compiled = await compile(source, {
      ...(pluginOptions(locale) as any),
    });

    const mod = await run(compiled, {
      ...(runtime as any),
      baseUrl: import.meta.url,
    });

    MDXContent = mod.default as MdxContentComponent;

    if (!skipCache) {
      asyncCache.set(sourceHash, MDXContent);
    }
  }

  return {
    content: createElement(MDXContent, { components: components as any }),
  };
}

/**
 * Compile MDX client-side synchronously using @mdx-js/mdx compileSync + runSync.
 * Results cached by source hash unless skipCache is set.
 *
 * @param {CompileOptions} opts - Compilation options
 * @param {boolean} [opts.skipCache=false] - Skip cache and force recompilation
 * @returns {MdxCompileResult}
 */
export function compileRuntimeSync(
  opts: CompileOptions & { skipCache?: boolean },
): MdxCompileResult {
  const { source, components, skipCache = false } = opts;
  const locale = opts.locale ?? DEFAULT_KEYWORD_LOCALE;
  const sourceHash = `${locale}:${hashSource(source)}`;

  let MDXContent = skipCache ? undefined : syncCache.get(sourceHash);

  if (!MDXContent) {
    const compiled = compileSync(source, {
      ...(pluginOptions(locale) as any),
    });

    MDXContent = runSync(compiled, {
      ...(runtime as any),
      baseUrl: import.meta.url,
    }).default as MdxContentComponent;

    if (!skipCache) {
      syncCache.set(sourceHash, MDXContent);
    }
  }

  return {
    content: createElement(MDXContent, { components: components as any }),
  };
}

/**
 * Async template literal for compiling MDX.
 * Interpolations are joined into the source text.
 *
 * @example
 * ```tsx
 * const result = await csr`This is **bold** ${variable}`;
 * ```
 */
export async function mdx(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<MdxCompileResult> {
  let source = '';
  for (let i = 0; i < strings.length; i++) {
    source += strings[i];
    if (i < values.length) {
      source += values[i];
    }
  }

  return compileRuntime({ source, components: {} });
}

/**
 * Sync template literal for compiling MDX.
 * Interpolations are joined into the source text.
 *
 * @example
 * ```tsx
 * const result = csrSync`This is **bold** ${variable}`;
 * ```
 */
export function mdxSync(
  strings: TemplateStringsArray,
  ...values: any[]
): MdxCompileResult {
  let source = '';
  for (let i = 0; i < strings.length; i++) {
    source += strings[i];
    if (i < values.length) {
      source += values[i];
    }
  }

  return compileRuntimeSync({ source, components: {} });
}

/**
 * Clear both async and sync compilation caches.
 */
export function clearCompileRuntimeCache(): void {
  asyncCache.clear();
  syncCache.clear();
}
