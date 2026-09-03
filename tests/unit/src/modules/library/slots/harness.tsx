/**
 * @fileoverview Slot card test harness.
 * @description Reads the heirloom fixture, compiles sources through the static
 * pipeline with the attribute rewrite on (as production would), and renders
 * them to markup.
 *
 * @module tests/unit/src/modules/library/slots/harness
 * @version 0.3.0
 * @author Typeir
 * @since 2026-09-02
 */

import { compileStatic } from '@/modules/library/infrastructure/compile/compileStatic';
import enrichedComponents from '@/modules/library/presentation/components';
import { slotComponents } from '@/modules/library/presentation/components/slots';
import { readFileSync } from 'fs';
import path from 'path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

/**
 * Fixture directory.
 */
export const FIXTURE_DIR = path.resolve(process.cwd(), 'tests/fixtures/slots');

/**
 * The heirloom fixture, written in the default spelling (attributes).
 */
export const FIXTURE_FILE = 'alfanjon.mdx';

/**
 * Reads the fixture source.
 *
 * @returns {string} Fixture source
 */
export function fixtureSource(): string {
  return readFileSync(path.join(FIXTURE_DIR, FIXTURE_FILE), 'utf8');
}

/**
 * Component registry: production components plus the slot card components.
 *
 * @param {Record<string, unknown>} [overrides] - Registry overrides
 * @returns {Record<string, unknown>} Merged registry
 */
export function registry(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return { ...enrichedComponents, ...slotComponents, ...overrides };
}

/**
 * Options accepted by the harness compile and render calls.
 *
 * @property {Record<string, unknown>} [components] - Registry overrides
 * @property {{ keys: string[]; records: string[] }} [aspects] - Aspect index
 */
export interface HarnessOptions {
  components?: Record<string, unknown>;
  aspects?: { keys: string[]; records: string[] };
}

/**
 * Compiles MDX source through the static pipeline.
 *
 * @param {string} source - MDX source
 * @param {HarnessOptions} [opts] - Options
 * @returns {Promise<React.ReactElement>} Compiled content element
 */
export async function compileSource(
  source: string,
  opts: HarnessOptions = {},
): Promise<React.ReactElement> {
  const result = await compileStatic({
    source,
    components: registry(opts.components),
    locale: 'en',
    aspects: opts.aspects,
  });
  return result.content;
}

/**
 * Renders MDX source to static markup.
 *
 * @param {string} source - MDX source
 * @param {HarnessOptions} [opts] - Options
 * @returns {Promise<string>} Static markup
 */
export async function renderSource(
  source: string,
  opts: HarnessOptions = {},
): Promise<string> {
  return renderToStaticMarkup(await compileSource(source, opts));
}

/**
 * Compiles the fixture through the static pipeline.
 *
 * @param {HarnessOptions} [opts] - Options
 * @returns {Promise<React.ReactElement>} Compiled content element
 */
export async function compileFixture(
  opts: HarnessOptions = {},
): Promise<React.ReactElement> {
  return compileSource(fixtureSource(), opts);
}

/**
 * Renders the fixture to static markup.
 *
 * @param {HarnessOptions} [opts] - Options
 * @returns {Promise<string>} Static markup
 */
export async function renderFixture(
  opts: HarnessOptions = {},
): Promise<string> {
  return renderSource(fixtureSource(), opts);
}

/**
 * One feature in the element spelling, for the escape-hatch checks.
 *
 * @param {string} cost - Cost slot text
 * @param {string} [targets] - Targets slot text
 * @returns {string} MDX source
 */
export function elementFeature(cost: string, targets?: string): string {
  const run = targets
    ? `<Cost>${cost}</Cost>\n<Targets>${targets}</Targets>`
    : `<Cost>${cost}</Cost>`;
  return `<Feature>\n\n#### Probe\n\n${run}\n\nTail.\n\n</Feature>\n`;
}
