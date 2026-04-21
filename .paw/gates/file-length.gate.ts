/**
 * File Length Gate
 *
 * @fileoverview Thin wrapper that delegates to the canonical check-file-length
 * script and adapts the result for the PAW gate system.
 *
 * @module .paw/gates/file-length.gate
 * @author Typeir
 * @version 2.0.0
 * @since 3.0.0
 */

import type {
    GateContext,
    GateResult,
    QualityGate,
} from '../../.github/PAW/health-check-types';
import { runCheck } from '../../.github/scripts/check-file-length.ts';
import { adaptCheckResult } from './adapt-result.ts';

export const gate: QualityGate = {
  id: 'file-length',
  name: 'File Length',
  port: 'build-integrity',
  severity: 'critical',
  appliesTo: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.scss', '.css'],

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
