/**
 * Test Gaps Gate
 *
 * @fileoverview Thin wrapper that delegates to the canonical check-test-gaps
 * script and adapts the result for the PAW gate system.
 *
 * @module .paw/gates/test-gaps.gate
 * @author Typeir
 * @version 2.0.0
 * @since 3.0.0
 */

import { runCheck } from '../../.github/scripts/checkTestGaps.ts';
import type { GateContext, GateResult, QualityGate } from '../healthCheckTypes';
import { adaptCheckResult } from './adaptResult.ts';

export const gate: QualityGate = {
  id: 'test-gaps',
  name: 'Test Coverage Gaps',
  port: 'test-coverage',
  severity: 'critical',
  appliesTo: ['.ts', '.tsx'],

  async check(context: GateContext): Promise<GateResult> {
    const files = await context.targetFiles(this.appliesTo);
    const result = await runCheck({
      rootDir: context.rootDir,
      files,
    });
    return adaptCheckResult(this.id, result);
  },
};
