/**
 * File Length Gate
 *
 * @fileoverview Delegates to check-file-length and adapts the result for the PAW gate system.
 *
 * @module .paw/gates/file-length.gate
 * @author Typeir
 * @version 2.0.0
 * @since 3.0.0
 */

import { runCheck } from '../../.github/scripts/checkFileLength.ts';
import type { GateContext, GateResult, QualityGate } from '../healthCheckTypes';
import { adaptCheckResult } from './adaptResult.ts';

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
