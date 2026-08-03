/**
 * Reusable Source Resolution
 *
 * @fileoverview Single entry point that turns authored content source into
 * source with every reusable region spliced in.
 *
 * Both MDX compilers call this. Wiring the discovery and inlining steps
 * separately into each compiler is how `<LesserMooncleave />` reached the
 * renderer unresolved: only one of the two paths had been wired, and nothing
 * failed until a page that used a reusable was requested.
 *
 * The library route compiles through `compileStatic`, so that is the path that
 * matters for anything a reader sees.
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
 *
 * Inlining happens at source level so a region compiles as part of its host,
 * with the host's component map, keeping interactive components interactive.
 *
 * Applying this twice is harmless: once a reference is replaced there is no
 * tag left to match.
 *
 * @param {string} source - Authored document source
 * @returns {Promise<string>} Source with references resolved
 */
export async function resolveReusableSource(source: string): Promise<string> {
  const registry = await discoverReusables(CONTENT_ROOT);
  return inlineReusables(source, registry);
}
