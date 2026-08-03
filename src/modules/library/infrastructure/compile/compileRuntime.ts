/**
 * @fileoverview Client-side MDX compiler.
 * @description Lightweight MDX compilation for tooltips and other client-side content.
 * Uses @mdx-js/mdx compile/run API for both sync and async compilation.
 * Includes hash-based caching to avoid recompiling identical sources.
 * Supports both async and sync template literal syntax.
 *
 * @module lib/mdx/compileRuntime
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import remarkDiceRoll from '@/lib/md/remarkDiceRoll';
import remarkUnit from '@/lib/md/remarkUnit';
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
 * Internal cache maps for compiled MDX.
 * Async and sync caches are separate.
 */
const asyncCache = new Map<string, MdxCompileResult>();
const syncCache = new Map<string, MdxCompileResult>();

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

/** @internal Shared plugin options for all compile calls */
const PLUGIN_OPTIONS = {
  remarkPlugins: [remarkGfm, remarkMath, remarkDiceRoll, remarkUnit],
  rehypePlugins: [rehypeKatex],
  outputFormat: 'function-body' as const,
};

/**
 * Compile MDX client-side async using @mdx-js/mdx compile + run.
 * Results are cached by source hash to avoid recompilation.
 *
 * @param {CompileOptions} opts - Compilation options
 * @param {boolean} [opts.skipCache=false] - Skip cache and force recompilation
 * @returns {Promise<MdxCompileResult>}
 */
export async function compileRuntime(
  opts: CompileOptions & { skipCache?: boolean },
): Promise<MdxCompileResult> {
  const { source, components, skipCache = false } = opts;
  const sourceHash = hashSource(source);

  if (!skipCache && asyncCache.has(sourceHash)) {
    return asyncCache.get(sourceHash)!;
  }

  const compiled = await compile(source, {
    ...(PLUGIN_OPTIONS as any),
  });

  const { default: MDXContent } = await run(compiled, {
    ...(runtime as any),
    baseUrl: import.meta.url,
  });

  const result: MdxCompileResult = {
    content: createElement(MDXContent as React.FC<{ components?: unknown }>, {
      components: components as any,
    }),
  };

  if (!skipCache) {
    asyncCache.set(sourceHash, result);
  }

  return result;
}

/**
 * Compile MDX client-side synchronously using @mdx-js/mdx compileSync + runSync.
 * Results are cached by source hash to avoid recompilation.
 * Much faster than async variant for repeated compilations.
 *
 * @param {CompileOptions} opts - Compilation options
 * @param {boolean} [opts.skipCache=false] - Skip cache and force recompilation
 * @returns {MdxCompileResult}
 */
export function compileRuntimeSync(
  opts: CompileOptions & { skipCache?: boolean },
): MdxCompileResult {
  const { source, components, skipCache = false } = opts;
  const sourceHash = hashSource(source);

  if (!skipCache && syncCache.has(sourceHash)) {
    return syncCache.get(sourceHash)!;
  }

  const compiled = compileSync(source, {
    ...(PLUGIN_OPTIONS as any),
  });

  const { default: MDXContent } = runSync(compiled, {
    ...(runtime as any),
    baseUrl: import.meta.url,
  });

  const result: MdxCompileResult = {
    content: createElement(MDXContent as React.FC<{ components?: unknown }>, {
      components: components as any,
    }),
  };

  if (!skipCache) {
    syncCache.set(sourceHash, result);
  }

  return result;
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
 * Much faster than async variant.
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
 * Useful for testing or when you need to force fresh compilations.
 */
export function clearCompileRuntimeCache(): void {
  asyncCache.clear();
  syncCache.clear();
}
