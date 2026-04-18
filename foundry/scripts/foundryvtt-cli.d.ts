/**
 * @fileoverview Type declarations for @foundryvtt/foundryvtt-cli
 * @description Ambient module declaration to suppress implicit-any errors for
 * the untyped @foundryvtt/foundryvtt-cli package.
 *
 * @module foundry/scripts/foundryvtt-cli.d.ts
 * @author David
 * @version 1.0.0
 * @since 2026-04-17
 */

declare module '@foundryvtt/foundryvtt-cli' {
  /**
   * Compiles a source directory into a LevelDB Foundry VTT pack.
   *
   * @param {string} sourceDir - Path to the _source directory
   * @param {string} outputDir - Path to the output pack directory
   * @param {object} [options] - Compilation options
   * @param {boolean} [options.log] - Whether to log progress
   * @returns {Promise<void>}
   */
  export function compilePack(
    sourceDir: string,
    outputDir: string,
    options?: { log?: boolean },
  ): Promise<void>;

  /**
   * Extracts a LevelDB Foundry VTT pack into a source directory.
   *
   * @param {string} packDir - Path to the pack directory
   * @param {string} outputDir - Path to the output _source directory
   * @param {object} [options] - Extraction options
   * @param {boolean} [options.log] - Whether to log progress
   * @returns {Promise<void>}
   */
  export function extractPack(
    packDir: string,
    outputDir: string,
    options?: { log?: boolean },
  ): Promise<void>;
}
