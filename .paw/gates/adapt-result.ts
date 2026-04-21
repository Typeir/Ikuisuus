/**
 * Gate Result Adapter
 *
 * @fileoverview Converts CheckResult from health check scripts into GateResult
 * for the PAW gate system. Used by all thin-wrapper gates to bridge the two
 * type systems without duplicating conversion logic.
 *
 * @module .paw/gates/adapt-result
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

import type {
  GateFinding,
  GateResult,
  GateStats,
} from '../../.github/PAW/health-check-types';
import type { CheckResult } from '../../.github/scripts/health-check-types';

/**
 * Adapt a CheckResult from a health check script into a GateResult.
 *
 * @param {string} gateId - Gate identifier
 * @param {CheckResult} result - Script check result
 * @returns GateResult compatible with the PAW gate system
 */
export function adaptCheckResult(
  gateId: string,
  result: CheckResult,
): GateResult {
  const findings: GateFinding[] = result.failures.map((f) => ({
    file: f.file,
    line: f.line,
    rule: f.rule,
    message: f.message,
    suggestion: f.suggestion,
    severity: f.severity,
    indirectFix: f.indirectFix,
  }));

  const stats: GateStats = {
    filesChecked:
      result.stats.total_files_checked ?? result.stats.totalFilesChecked ?? 0,
    findingsCount:
      result.stats.violations_found ?? result.stats.violationsFound ?? 0,
    durationMs: 0,
  };

  return {
    gate: gateId,
    passed: result.passed,
    severity: result.severity,
    findings,
    stats,
  };
}
