/**
 * Orphaned MDX Links Gate
 *
 * @fileoverview Thin wrapper that delegates to the canonical
 * check-orphaned-mdx-links script and adapts the result for the PAW gate system.
 *
 * @module .paw/gates/orphaned-mdx-links.gate
 * @author Typeir
 * @version 2.0.0
 * @since 3.0.0
 */

import type {
    GateContext,
    GateResult,
    QualityGate,
} from '../../.github/PAW/health-check-types';
import { runCheck } from '../../.github/scripts/check-orphaned-mdx-links.ts';
import { adaptCheckResult } from './adapt-result.ts';

export const gate: QualityGate = {
  id: 'orphaned-mdx-links',
  name: 'Orphaned MDX Links',
  port: 'content-structure',
  severity: 'warning',
  appliesTo: ['.mdx'],

  async check(context: GateContext): Promise<GateResult> {
    const result = await runCheck({
      rootDir: context.rootDir,
      readFile: (rel) => context.readFile(rel),
    });
    return adaptCheckResult(this.id, result);
  },
};
