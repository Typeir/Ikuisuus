/**
 * SCSS ESM Loader Hook
 *
 * @fileoverview Node.js ESM load hook intercepting .scss imports. Returns a
 * Proxy default export so CSS module property access returns the property name
 * as a string.
 *
 * @module scripts/utils/scssLoader
 */

import { fileURLToPath } from 'node:url';

/**
 * Context object passed to Node.js ESM load hooks.
 */
interface LoadContext {
  conditions: string[];
  format?: string | null;
}

/**
 * Return value expected from Node.js ESM load hooks.
 */
interface LoadReturn {
  format: string;
  source?: string;
  shortCircuit?: boolean;
}

/**
 * Signature of the next loader in the Node.js ESM hook chain.
 */
type NextLoad = (url: string, context?: LoadContext) => Promise<LoadReturn>;

/**
 * ESM load hook — short-circuits .scss imports with a Proxy default export so
 * CSS class lookups return the property name.
 *
 * @param url Resolved module URL
 * @param context Load context object
 * @param nextLoad Next loader in the chain
 * @returns Synthetic module source for SCSS files, or delegated result otherwise
 */
export async function load(url: string, context: LoadContext, nextLoad: NextLoad): Promise<LoadReturn> {
  if (url.endsWith('.scss')) {
    const resourcePath = fileURLToPath(url);
    const source = [
      "import { createRequire } from 'node:module';",
      'const require = createRequire(import.meta.url);',
      "const { getCssModuleLocalIdent } = require('next/dist/build/webpack/config/blocks/css/loaders/getCssModuleLocalIdent');",
      `const resourcePath = ${JSON.stringify(resourcePath)};`,
      'const getLocalIdent = (exportName) => getCssModuleLocalIdent({ rootContext: process.cwd(), resourcePath }, "", exportName, {});',
      'const proxy = new Proxy({}, {',
      '  get: (_, prop) => {',
      '    if (prop === "__esModule") return true;',
      '    if (prop === "default") return proxy;',
      '    return typeof prop === "string" ? getLocalIdent(prop) : undefined;',
      '  },',
      '});',
      'export default proxy;',
    ].join('\n');

    return { format: 'module', source, shortCircuit: true };
  }

  return nextLoad(url, context);
}
