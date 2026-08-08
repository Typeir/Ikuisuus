/**
 * @fileoverview Turns a `.glsl` file into a module whose default export is the
 * shader source.
 *
 * This restores what webpack's `asset/source` did before the Next 16 migration.
 * Turbopack's nearest-looking replacement, `type: 'raw'`, is not equivalent: it
 * produces a module with no `default` export, and the compiler then folds every
 * importing reference to `void 0` without a warning or a build failure. The
 * result was 25 shaders silently blanked, `ShaderMaterial` receiving `undefined`
 * sources, and `VALIDATE_STATUS false` on every celestial. `type: 'text'`
 * appears in Next's own typings but is rejected by the Turbopack compiler, and
 * `type: 'asset'` yields a URL rather than the source, so a loader is the only
 * mapping that returns file contents as a string.
 *
 * CommonJS because Turbopack loads webpack loaders in a bare Node host that
 * resolves them with `require`. `vitest.config.ts` carries the same transform as
 * a Vite plugin so tests see the identical string.
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
