/**
 * Health Check Shared Types
 *
 * @fileoverview Canonical type definitions shared across all health-check scripts
 * and the composite orchestrator.
 *
 * @module .github/scripts/health-check-types
 */

/**
 * A single rule violation found during a health check.
 */
export interface CheckFailure {
  /** Source file relative to project root */
  file: string;
  /** Line number of the violation, if applicable */
  line?: number;
  /** Rule identifier that was violated */
  rule: string;
  /** Human-readable violation description */
  message: string;
  /** Actionable fix suggestion */
  suggestion?: string;
  /** Per-failure severity override (some checks mix severities) */
  severity?: 'critical' | 'warning';
}

/**
 * Numeric summary produced by a check run.
 */
export interface CheckStats {
  /** Number of files examined */
  total_files_checked: number;
  /** Number of violations found */
  violations_found: number;
  /** Any additional check-specific counters */
  [key: string]: number;
}

/**
 * Result object emitted by every individual check script.
 */
export interface CheckResult {
  /** Check identifier (e.g. "file-length") */
  check: string;
  /** Aggregate severity of failures */
  severity: 'critical' | 'warning' | 'info';
  /** True when no violations were found */
  passed: boolean;
  /** List of individual violations */
  failures: CheckFailure[];
  /** Summary statistics */
  stats: CheckStats;
}

/**
 * Top-level report produced by the composite health-check orchestrator.
 */
export interface HealthReport {
  /** ISO timestamp of the run */
  timestamp: string;
  /** "full" or "changed-only" */
  mode: string;
  /** Changed file list when mode is "changed-only", otherwise null */
  changed_files: string[] | null;
  /** "PASS" or "FAIL" */
  overall: string;
  /** Aggregate summary counters */
  summary: {
    total_checks: number;
    passed: number;
    failed: number;
    total_violations: number;
    has_critical: boolean;
  };
  /** Per-check results */
  checks: CheckResult[];
}
