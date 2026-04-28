/**
 * @fileoverview Server-only helper that serializes evaluated MDX React nodes
 * to an HTML string using react-dom/server. This module must only be imported
 * from server-side code or scripts (not from modules used by the Next.js app
 * client graph).
 * @module src/lib/mdx/serverRender
 * @author Typeir
 * @version 1.0.0
 * @since 2026-04-28
 */

import * as ReactDOMServer from 'react-dom/server';

/**
 * Render an evaluation result's `content` (React node) to HTML.
 *
 * @param {object} evalResult - Result object returned from the MDX evaluator
 * @param {unknown} evalResult.content - React node produced by evaluation
 * @returns {string} HTML string
 */
export function renderToHtml(evalResult: { content: unknown }): string {
  return ReactDOMServer.renderToStaticMarkup(evalResult.content as any);
}
