/**
 * MDX Outlier Compiler
 *
 * @fileoverview Compiles identified outlier MDX files into static HTML using
 * the real app component map. Processes outliers in topological order so
 * inter-outlier dependencies resolve correctly.
 *
 * @module findReusableMdxOutliers/compiler
 * @author Typeir
 * @version 1.0.0
 * @see {@link compileOutliers} for the main compilation function
 * @since 3.0.0
 */

import fs from 'fs/promises';
import React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { pathToFileURL } from 'url';

/**
 * Creates a React FC that renders pre-compiled HTML via dangerouslySetInnerHTML.
 * Used to inject already-compiled outlier HTML into dependent MDX evaluations.
 *
 * @param {string} html - Pre-rendered HTML string
 * @returns React FC that renders the HTML
 */
export const htmlComponent = (
  html: string,
): React.FC<Record<string, unknown>> => {
  const HtmlComp = () =>
    React.createElement('div', { dangerouslySetInnerHTML: { __html: html } });
  return HtmlComp;
};

/**
 * Demotes compiled HTML heading tags from h1 to h2.
 *
 * @param {string} html - Rendered static HTML string
 * @returns HTML with h1 headings replaced by h2 headings
 */
const demoteCompiledH1Headings = (html: string): string =>
  html.replace(/<h1(\b[^>]*)>/g, '<h2$1>').replace(/<\/h1>/g, '</h2>');

/**
 * Result of compiling a single outlier.
 *
 * @property tag - PascalCase component name
 * @property html - Rendered static HTML
 * @property filePath - Absolute source file path
 * @property deps - Names of outlier dependencies
 */
export interface CompiledOutlier {
  tag: string;
  html: string;
  filePath: string;
  deps: string[];
}

/**
 * Compiles outlier MDX files in topological order, producing static HTML for each.
 *
 * @param {string[]} compileOrder - Topologically sorted outlier names (leaves first)
 * @param {Record<string, string>} mdxMap - Map of PascalCase name → absolute file path
 * @param {Map<string, Set<string>>} deps - Dependency graph (name → set of names it depends on)
 * @param {Record<string, React.FC>} components - Real app component map from src/lib/components/mdx
 * @returns Array of compiled outlier results in compile order
 */
export const compileOutliers = async (
  compileOrder: string[],
  mdxMap: Record<string, string>,
  deps: Map<string, Set<string>>,
  components: Record<string, React.FC<any>>,
): Promise<CompiledOutlier[]> => {
  const { evaluate } = await import('next-mdx-remote-client/rsc');

  const tableComponent: React.FC<{ children?: React.ReactNode }> = ({
    children,
  }) =>
    React.createElement(
      'div',
      { className: 'overflow-x-auto max-w-full' },
      React.createElement('table', null, children),
    );

  const compiledHtml = new Map<string, string>();
  const results: CompiledOutlier[] = [];

  for (const tag of compileOrder) {
    const filePath = mdxMap[tag];
    const rawContent = await fs.readFile(filePath, 'utf8');

    const componentMap: Record<string, React.FC<any>> = {
      ...components,
      table: tableComponent,
    };
    for (const [compiledName, html] of compiledHtml) {
      componentMap[compiledName] = htmlComponent(html);
    }

    const result = await evaluate({
      source: rawContent,
      components: componentMap,
      options: {
        parseFrontmatter: true,
        mdxOptions: {
          remarkPlugins: [remarkGfm, remarkMath],
          rehypePlugins: [rehypeKatex],
          baseUrl: pathToFileURL(filePath).toString(),
        },
      },
    });

    const renderedHtml = ReactDOMServer.renderToStaticMarkup(result.content);
    const html = demoteCompiledH1Headings(renderedHtml);
    compiledHtml.set(tag, html);

    results.push({
      tag,
      html,
      filePath,
      deps: [...(deps.get(tag) ?? [])],
    });
  }

  return results;
};
