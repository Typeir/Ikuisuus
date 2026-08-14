/**
 * @fileoverview MDX-to-HTML converter for Foundry VTT descriptions.
 * @description Compiles MDX content to HTML via next-mdx-remote-client/rsc
 * evaluate + ReactDOMServer. Custom JSX components are no-op or pass-through
 * stubs.
 *
 * @module foundry/scripts/utils/mdxToHtml
 * @version 2.0.0
 * @author Typeir
 * @since 2026-04-12
 *
 * @see {@link extractMonsterDescription} for monster-specific extraction
 */

import { compileDynamic } from '@/modules/library/infrastructure/compile/compileDynamic';
import { renderToHtml } from '@/modules/library/infrastructure/compile/serverRender';
import React from 'react';
import remarkGfm from 'remark-gfm';
import type { MonsterFeature } from '../../../src/lib/types/feature';

/**
 * No-op component that renders nothing. Stubs JSX tags irrelevant to the
 * Foundry VTT export (BlendedImage, MonsterTable, etc.).
 *
 * @returns {null} Renders nothing
 */
const Noop: React.FC<Record<string, unknown>> = () => null;

/**
 * Wrapping stub that renders only its children.
 *
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Child content
 * @returns {React.ReactElement} Fragment containing children
 */
const PassThrough: React.FC<{ children?: React.ReactNode }> = ({ children }) =>
  React.createElement(React.Fragment, null, children);

/**
 * Renders an HTML table element.
 *
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Table contents (thead, tbody, etc.)
 * @returns {React.ReactElement} HTML table element
 */
const TableWrapper: React.FC<{ children?: React.ReactNode }> = ({ children }) =>
  React.createElement('table', null, children);

/**
 * Renders a BlendedImage as a plain HTML img tag.
 *
 * @param {Record<string, unknown>} props - Image attributes
 * @returns {React.ReactElement} An img element
 */
const ImgStub: React.FC<Record<string, unknown>> = (props) =>
  React.createElement('img', { src: props.src, alt: props.alt });

/**
 * Component map passed to MDX evaluate().
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
 * @param {string} mdx - Raw MDX file content
 * @returns {Promise<string>} Clean HTML string for Foundry VTT description fields
 */
export async function mdxToHtml(mdx: string): Promise<string> {
  const result = await compileDynamic({
    source: mdx,
    components: FOUNDRY_COMPONENTS,
    mdxOptions: { remarkPlugins: [remarkGfm] },
    parseFrontmatter: true,
  });

  return renderToHtml(result);
}

/**
 * Extracts the description portion of a monster MDX file. Strips the stat
 * block header (title, type line, AC/HP/Speed table, ability score table, and
 * properties list); returns only the traits, actions, and other narrative
 * content.
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
