/**
 * ESM loader hook that intercepts .scss and .module.scss imports.
 *
 * @fileoverview Returns a Proxy default export so that CSS module property
 * access (e.g. styles.container) returns the property name as a plain string.
 * This allows importing React components that depend on CSS modules in a
 * Node/tsx script context without a bundler.
 *
 * @module scssLoader
 * @version 1.1.0
 * @since 2.0.0
 */

import { fileURLToPath } from 'node:url';

/**
 * ESM load hook — short-circuits .scss imports with a Proxy default export.
 *
 * @param {string} url - Resolved module URL
 * @param {object} context - Load context
 * @param {Function} nextLoad - Next loader in the chain
 * @returns {object} Module source or delegated result
 */
export async function load(url, context, nextLoad) {
  if (url.endsWith('.scss')) {
    const resourcePath = fileURLToPath(url);
    return {
      format: 'module',
      source: [
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
      ].join('\n'),
      shortCircuit: true,
    };
  }
  return nextLoad(url, context);
}
