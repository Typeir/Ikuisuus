/**
 * TypeScript Compilation Gate
 *
 * @fileoverview Thin wrapper that delegates to the canonical check-tsc-compilation
 * script and adapts the result for the PAW gate system. Runs tsc compilation check
 * filtered to target files via PAW context.
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
