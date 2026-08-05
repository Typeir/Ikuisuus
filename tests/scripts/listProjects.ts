/**
 * @fileoverview Emits the vitest project list.
 * @description Prints the projects defined for the suite, so CI can build a
 * matrix from the same list the local runner uses instead of a copy that drifts
 * every time a project is split.
 *
 * `--json` emits a JSON array for `fromJSON()` in a workflow matrix; the default
 * is one name per line for shell use.
 *
 * @module tests/scripts/listProjects
 * @author Typeir
 * @version 1.0.0
 * @since 2026-08-04
 */

import { PROJECTS } from './runTests';

/**
 * Prints the project list in the requested shape.
 *
 * @returns {void}
 */
function main(): void {
  const asJson = process.argv.includes('--json');
  console.log(asJson ? JSON.stringify(PROJECTS) : PROJECTS.join('\n'));
}

main();
