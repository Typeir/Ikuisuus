/**
 * Health Check Types
 *
 * @fileoverview Type definitions shared by all health check scripts and the
 * composite orchestrator. Gates in .paw/gates/ import these types to adapt
 * script results into gate results.
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
 * @property {'critical' | 'warning'} [severity] - Per-finding severity override
 * @property {boolean} [indirectFix] - True if this finding cannot be fixed by editing the violated file
 */
export interface CheckFailure {
  file: string;
  line?: number;
  rule: string;
  message: string;
  suggestion?: string;
  severity?: 'critical' | 'warning';
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
 * callers. When omitted, scripts self-discover files from the filesystem.
 *
 * @interface CheckOptions
 * @property {string} [rootDir] - Project root directory. Defaults to auto-detected.
 * @property {string[]} [files] - Pre-resolved relative file paths. Skips file discovery when provided.
 * @property {Function} [readFile] - Cached file reader. Defaults to fs.readFile.
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
