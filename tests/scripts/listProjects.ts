/**
 * @fileoverview Emits the vitest project list.
 * @description Prints the projects defined for the suite. With `--json`, emits
 * a JSON array; otherwise one name per line.
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
