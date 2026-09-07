/**
 * Health Check Types
 *
 * @fileoverview Type definitions shared by all health check scripts and the
 * composite orchestrator.
 *
 * @module .github/scripts/health-check-types
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

/**
 * A single violation found by a health check script.
 *
 * @interface CheckFailure
 * @property {string} file - File path relative to project root
 * @property {number} [line] - Line number (1-based)
 * @property {string} rule - Rule identifier within this check
 * @property {string} message - Human-readable violation description
 * @property {string} [suggestion] - Actionable fix suggestion
 * @property {'critical' | 'warning' | 'info'} [severity] - Per-finding severity override; `info` states a measurement for the author to read and never fails the check
 * @property {boolean} [indirectFix] - True if this finding cannot be fixed by editing the violated file
 */
export interface CheckFailure {
  file: string;
  line?: number;
  rule: string;
  message: string;
  suggestion?: string;
  severity?: 'critical' | 'warning' | 'info';
  indirectFix?: boolean;
}

/**
 * Output from a single health check script execution.
 *
 * @interface CheckResult
 * @property {string} check - Check identifier
 * @property {'critical' | 'warning' | 'info'} severity - Aggregate severity
 * @property {boolean} passed - True if no blocking violations found
 * @property {CheckFailure[]} failures - Individual violations
 * @property {Record<string, number>} stats - Execution statistics
 */
export interface CheckResult {
  check: string;
  severity: 'critical' | 'warning' | 'info';
  passed: boolean;
  failures: CheckFailure[];
  stats: Record<string, number>;
}

/**
 * Optional execution context passed to runCheck() by PAW gates or other
 * callers.
 *
 * @interface CheckOptions
 * @property {string} [rootDir] - Project root directory.
 * @property {string[]} [files] - Pre-resolved relative file paths.
 * @property {Function} [readFile] - Cached file reader.
 */
export interface CheckOptions {
  rootDir?: string;
  files?: string[];
  readFile?: (relativePath: string) => Promise<string>;
}

/**
 * Top-level report produced by the composite health check orchestrator.
 *
 * @interface HealthReport
 * @property {string} timestamp - ISO timestamp of the run
 * @property {'full' | 'changed-only'} mode - Execution mode
 * @property {string[] | null} changed_files - Changed file list when scoped
 * @property {'PASS' | 'FAIL'} overall - Aggregate result
 * @property {object} summary - Aggregate counters
 * @property {CheckResult[]} checks - Per-check results
 */
export interface HealthReport {
  timestamp: string;
  mode: 'full' | 'changed-only';
  changed_files: string[] | null;
  overall: 'PASS' | 'FAIL';
  summary: {
    total_checks: number;
    passed: number;
    failed: number;
    total_violations: number;
    has_critical: boolean;
  };
  checks: CheckResult[];
}
