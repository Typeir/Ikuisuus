/**
 * SCSS Module Shim — preload via --import flag.
 *
 * @fileoverview Registers both ESM and CJS hooks so that .scss and
 * .module.scss imports resolve to inert Proxy objects. This enables
 * scripts to import React components that depend on CSS modules without
 * a bundler.
 *
 * @module scssShim
 * @author Typeir
 * @version 1.2.0
 * @since 2.0.0
 *
 * @example
 * // In package.json scripts:
 * // "my-script": "npx tsx --import ./scripts/utils/scssShim.ts scripts/myScript.ts"
 */

import Module, { register } from 'node:module';

/** ESM loader hook for import statements */
register(new URL('./scssLoader.mjs', import.meta.url));

/** CJS require extension for tsx interop paths */
const extensions = (Module as any)._extensions;
extensions['.scss'] = function (_mod: any, filename: string) {
  _mod._compile(
    [
      "const { getCssModuleLocalIdent } = require('next/dist/build/webpack/config/blocks/css/loaders/getCssModuleLocalIdent');",
      'const resourcePath = __filename;',
      'const getLocalIdent = (exportName) => getCssModuleLocalIdent({ rootContext: process.cwd(), resourcePath }, "", exportName, {});',
      'const proxy = new Proxy({}, {',
      '  get: (_, prop) => {',
      '    if (prop === "__esModule") return true;',
      '    if (prop === "default") return proxy;',
      '    return typeof prop === "string" ? getLocalIdent(prop) : undefined;',
      '  },',
      '});',
      'module.exports = proxy;',
      'module.exports.default = proxy;',
      'module.exports.__esModule = true;',
    ].join('\n'),
    filename,
  );
};
