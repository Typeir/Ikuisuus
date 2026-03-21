/**
 * SCSS Module Shim — preload via --import flag.
 *
 * @fileoverview Registers both ESM and CJS hooks so that .scss and
 * .module.scss imports resolve to inert Proxy objects. This enables
 * scripts to import React components that depend on CSS modules without
 * a bundler.
 *
 * @module scssShim
 * @version 1.1.0
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
  _mod._compile('module.exports = {};', filename);
};
