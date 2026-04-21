/**
 * Duplicate CSS Gate
 *
 * @fileoverview Thin wrapper that delegates to the canonical check-duplicate-css
 * script and adapts the result for the PAW gate system.
 *
 * @module .paw/gates/duplicate-css.gate
 * @author Typeir
 * @version 2.0.0
 * @since 3.0.0
 */

import type {
    GateContext,
    GateResult,
    QualityGate,
} from '../../.github/PAW/health-check-types';
import { runCheck } from '../../.github/scripts/check-duplicate-css.ts';
import { adaptCheckResult } from './adapt-result.ts';

export const gate: QualityGate = {
  id: 'duplicate-css',
  name: 'Duplicate CSS',
  port: 'build-integrity',
  severity: 'critical',
  appliesTo: ['.scss', '.css'],

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
