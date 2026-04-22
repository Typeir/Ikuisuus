/**
 * JSDoc Quality Gate
 *
 * @fileoverview Thin wrapper that delegates to the canonical check-jsdoc-quality
 * script and adapts the result for the PAW gate system.
 *
 * @module .paw/gates/jsdoc-quality.gate
 * @author Typeir
 * @version 2.0.0
 * @since 3.0.0
 */

import { runCheck } from '../../.github/scripts/checkJsdocQuality.ts';
import type { GateContext, GateResult, QualityGate } from '../healthCheckTypes';
import { adaptCheckResult } from './adaptResult.ts';

export const gate: QualityGate = {
  id: 'jsdoc-quality',
  name: 'JSDoc Quality',
  port: 'code-quality',
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
