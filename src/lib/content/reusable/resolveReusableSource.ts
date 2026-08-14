/**
 * Reusable Source Resolution
 *
 * @fileoverview Splices every reusable region into authored content source.
 * Called by both MDX compilers. Layout independent of the compile path.
 *
 * @module lib/content/reusable/resolveReusableSource
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-03
 */

import path from 'path';
import { inlineReusables } from './inlineReusables';
import { discoverReusables } from './reusableRegistry';

/** Content root scanned for files that opt into reuse. */
const CONTENT_ROOT = path.join(process.cwd(), 'src/content');

/**
 * Splices reusable regions into a document before it is compiled.
 * Idempotent: a replaced reference leaves no tag to match on a second run.
 *
 * @param {string} source - Authored document source
 * @returns {Promise<string>} Source with references resolved
 */
export async function resolveReusableSource(source: string): Promise<string> {
  const registry = await discoverReusables(CONTENT_ROOT);
  return inlineReusables(source, registry);
}
