/**
 * MDX Content Format Gate
 *
 * @fileoverview Thin wrapper that delegates to the canonical check-mdx-format
 * script and adapts the result for the PAW gate system.
 *
 * @module .paw/gates/content-format.gate
 * @author Typeir
 * @version 2.0.0
 * @since 3.0.0
 */

import type {
  GateContext,
  GateResult,
  QualityGate,
} from '../../.github/PAW/health-check-types';
import { runCheck } from '../../.github/scripts/check-mdx-format.ts';
import { adaptCheckResult } from './adapt-result.ts';

export const gate: QualityGate = {
  id: 'content-format',
  name: 'MDX Content Format',
  port: 'content-structure',
  severity: 'critical',
  appliesTo: ['.mdx'],

  async check(context: GateContext): Promise<GateResult> {
    const result = await runCheck({
      rootDir: context.rootDir,
      readFile: (rel) => context.readFile(rel),
    });
    return adaptCheckResult(this.id, result);
  },
};
