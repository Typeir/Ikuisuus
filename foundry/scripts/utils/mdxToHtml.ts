/**
 * @fileoverview MDX-to-HTML converter for Foundry VTT descriptions.
 * @description Compiles MDX content to clean HTML using the same
 * next-mdx-remote-client/rsc + ReactDOMServer pipeline as the outlier
 * compiler. Custom JSX components are replaced with no-op stubs so the
 * evaluation succeeds without Next.js context or API routes.
 *
 * @module foundry/scripts/utils/mdxToHtml
 * @version 2.0.0
 * @author Typeir
 * @since 2026-04-12
 *
 * @see {@link extractMonsterDescription} for monster-specific extraction
 */

import { compileAsync } from '@/modules/library/infrastructure/compile/compileAsync';
import { renderToHtml } from '@/modules/library/infrastructure/compile/serverRender';
import React from 'react';
import remarkGfm from 'remark-gfm';
import type { MonsterFeature } from '../../../src/lib/types/feature';

/**
 * No-op React component used to stub out JSX tags that are irrelevant
 * in the Foundry VTT export (BlendedImage, MonsterTable, etc.).
 *
 * @returns {null} Renders nothing
 */
const Noop: React.FC<Record<string, unknown>> = () => null;

/**
 * Wrapping stub that renders only its children.
 * Used for layout wrappers like FlexRenderer.
 *
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Child content
 * @returns {React.ReactElement} Fragment containing children
 */
const PassThrough: React.FC<{ children?: React.ReactNode }> = ({ children }) =>
  React.createElement(React.Fragment, null, children);

/**
 * Table wrapper that renders an HTML table element.
 * Mirrors the app's table component without the CSS wrapper div.
 *
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Table contents (thead, tbody, etc.)
 * @returns {React.ReactElement} HTML table element
 */
const TableWrapper: React.FC<{ children?: React.ReactNode }> = ({ children }) =>
  React.createElement('table', null, children);

/**
 * Renders a BlendedImage as a plain HTML img tag.
 * BlendedImage takes standard img attributes (src, alt, etc.).
 *
 * @param {Record<string, unknown>} props - Image attributes
 * @returns {React.ReactElement} An img element
 */
const ImgStub: React.FC<Record<string, unknown>> = (props) =>
  React.createElement('img', { src: props.src, alt: props.alt });

/**
 * Component map passed to MDX evaluate(). Interactive or data-fetching
 * components become Noop; layout wrappers become PassThrough.
 */
const FOUNDRY_COMPONENTS: Record<string, React.FC<any>> = {
  BlendedImage: ImgStub,
  Image: ImgStub,
  Meta: Noop,
  MonsterTable: Noop,
  HeirloomTable: Noop,
  SpellTable: Noop,
  FilteredSpellTable: Noop,
  TrinketTable: Noop,
  Collapsible: PassThrough,
  FlexRenderer: PassThrough,
  HorizontalSplit: PassThrough,
  FloatedContainer: PassThrough,
  ClearFloats: Noop,
  ParallaxBackdrop: Noop,
  Tooltip: PassThrough,
  table: TableWrapper,
};

/**
 * Converts full MDX content string to Foundry-compatible HTML.
 *
 * Uses the same next-mdx-remote-client/rsc evaluate + ReactDOMServer
 * pipeline as the outlier compiler. Custom components are stubbed with
 * no-op or pass-through components.
 *
 * @param {string} mdx - Raw MDX file content
 * @returns {Promise<string>} Clean HTML string for Foundry VTT description fields
 */
export async function mdxToHtml(mdx: string): Promise<string> {
  const result = await compileAsync({
    source: mdx,
    components: FOUNDRY_COMPONENTS,
    mdxOptions: { remarkPlugins: [remarkGfm] },
    parseFrontmatter: true,
  });

  return renderToHtml(result);
}

/**
 * Extracts the description portion of a monster MDX file.
 * Strips the stat block header (title, type line, AC/HP/Speed table,
 * ability score table, and properties list) to return only the traits,
 * actions, and other narrative content.
 *
 * @param {string} mdx - Full MDX content of a monster sheet
 * @returns {Promise<string>} HTML of the description portion only
 */
export async function extractMonsterDescription(mdx: string): Promise<string> {
  const firstHrIndex = mdx.indexOf('\n---\n');
  if (firstHrIndex === -1) return mdxToHtml(mdx);

  const afterFirstHr = mdx.substring(firstHrIndex + 5);
  return mdxToHtml(afterFirstHr);
}

/**
 * Extracts per-feature MDX text using source line ranges and converts each
 * slice to HTML. Mutates features in place, setting `description`.
 *
 * @param {MonsterFeature[]} features - Features with source.start/end line ranges
 * @param {string} mdxContent - Full MDX file content
 */
export async function populateFeatureDescriptions(
  features: MonsterFeature[],
  mdxContent: string,
): Promise<void> {
  const allLines = mdxContent.split('\n');
  for (const f of features) {
    if (!f.source || f.description) continue;
    const slice = allLines.slice(f.source.start, f.source.end).join('\n');
    if (!slice.trim()) continue;
    try {
      f.description = await mdxToHtml(slice);
    } catch {
      f.description = slice.replace(
        /[<>&]/g,
        (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c] ?? c,
      );
    }
  }
}
