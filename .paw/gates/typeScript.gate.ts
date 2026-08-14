/**
 * TypeScript Compilation Gate
 *
 * @fileoverview Runs tsc compilation via check-tsc-compilation on the target files
 * and adapts the result for the PAW gate system.
 *
 * @module .paw/gates/typeScript.gate
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

import { runCheck } from '../../.github/scripts/checkTsCompilation.ts';
import type { GateContext, GateResult, QualityGate } from '../healthCheckTypes';
import { adaptCheckResult } from './adaptResult.ts';

export const gate: QualityGate = {
  id: 'type-script',
  name: 'TypeScript Compilation',
  port: 'build-integrity',
  severity: 'critical',
  appliesTo: ['.ts', '.tsx'],

  async check(context: GateContext): Promise<GateResult> {
    const files = await context.targetFiles(this.appliesTo);
    const result = await runCheck({
      rootDir: context.rootDir,
      files,
      readFile: (rel) => context.readFile(rel),
    });
    return adaptCheckResult(this.id, result);
  },
};
