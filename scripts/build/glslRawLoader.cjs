/**
 * @fileoverview Turns a `.glsl` file into a module whose default export is the
 * shader source.
 *
 * @module scripts/build/glslRawLoader
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-08
 */

/**
 * Webpack/Turbopack loader that emits shader source as a default-exported string.
 *
 * @param {string} source - Raw contents of the matched `.glsl` file.
 * @returns {string} An ES module exporting `source` as its default.
 */
module.exports = function glslRawLoader(source) {
  return `export default ${JSON.stringify(source)};`;
};
