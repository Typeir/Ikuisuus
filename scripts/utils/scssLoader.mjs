/**
 * ESM loader hook that intercepts .scss and .module.scss imports.
 *
 * @fileoverview Returns a Proxy default export so that CSS module property
 * access (e.g. styles.container) returns the property name as a plain string.
 * This allows importing React components that depend on CSS modules in a
 * Node/tsx script context without a bundler.
 *
 * @module scssLoader
 * @version 1.0.0
 * @since 2.0.0
 */

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
    return {
      format: 'module',
      source: [
        'const proxy = new Proxy({}, { get: (_, prop) => typeof prop === "string" ? prop : undefined });',
        'export default proxy;',
      ].join('\n'),
      shortCircuit: true,
    };
  }
  return nextLoad(url, context);
}
