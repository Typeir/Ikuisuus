/**
 * TypeScript Compilation Check
 *
 * @fileoverview Validates TypeScript compilation by running tsc --noEmit and
 * parsing diagnostics. Differentiates between errors (critical severity) and
 * warnings (warning severity). Supports both standalone execution (checks all
 * .ts/.tsx files) and PAW gate integration (filters to specified file list).
 *
 * @module .github/scripts/check-tsc-compilation
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
    CheckFailure,
    CheckOptions,
    CheckResult,
} from './health-check-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

/**
 * A parsed TypeScript diagnostic from tsc output.
 *
 * @interface Diagnostic
 * @property {string} file - File path relative to rootDir
 * @property {number} line - Line number (1-based)
 * @property {number} col - Column number (1-based)
 * @property {'error' | 'warning'} category - Diagnostic category
 * @property {string} code - Diagnostic code (e.g., 'TS2304')
 * @property {string} message - Diagnostic message
 */
interface Diagnostic {
  file: string;
  line: number;
  col: number;
  category: 'error' | 'warning';
  code: string;
  message: string;
}

/**
 * Parse tsc output to extract diagnostics.
 * Format: `src/file.ts(10,5): error TS2304: Cannot find name 'foo'.`
 *
 * @param output - Raw tsc stderr output
 * @param rootDir - Root directory for normalizing paths
 * @returns Array of parsed diagnostics
 */
function parseTscDiagnostics(output: string, rootDir: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const lines = output.split('\n');

  // Pattern: file(line,col): error|warning TSxxxx: message
  const pattern = /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(TS\d+):\s+(.+)$/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = pattern.exec(trimmed);
    if (match) {
      const [, filePath, lineStr, colStr, category, code, message] = match;
      // Normalize path to forward slashes
      const normalizedFile = filePath.replace(/\\/g, '/');

      diagnostics.push({
        file: normalizedFile,
        line: parseInt(lineStr, 10),
        col: parseInt(colStr, 10),
        category: category as 'error' | 'warning',
        code,
        message,
      });
    }
  }

  return diagnostics;
}

/**
 * Filter diagnostics to only those affecting target files.
 *
 * @param diagnostics - All diagnostics from tsc
 * @param files - Target file paths to filter by
 * @returns Filtered diagnostics
 */
function filterDiagnosticsByFile(
  diagnostics: Diagnostic[],
  files: string[],
): Diagnostic[] {
  const fileSet = new Set(files.map((f) => f.replace(/\\/g, '/')));
  return diagnostics.filter((d) => fileSet.has(d.file));
}

/**
 * Execute the TypeScript compilation check and return a structured result.
 *
 * When options.files is provided, runs tsc once and filters diagnostics to
 * only those files. When options.files is not provided, returns diagnostics
 * for all files that tsc reports.
 *
 * @param options - Optional execution context from PAW gates or CLI
 * @returns Check result with any violations
 */
export async function runCheck(options?: CheckOptions): Promise<CheckResult> {
  const rootDir = options?.rootDir ?? ROOT;
  const startTime = Date.now();

  let diagnostics: Diagnostic[] = [];
  let errorCount = 0;
  let warningCount = 0;

  try {
    // Run tsc with --noEmit to check types without emitting files
    // Use --pretty false for consistent output format
    // Exit code is 1 if errors found, but we still capture output via error handling
    execSync('tsc --noEmit --pretty false', {
      cwd: rootDir,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
  } catch (error) {
    // tsc exits with code 1 on errors, but stderr is still captured in error.stderr
    // or combined stdout/stderr depending on stdio settings
    if (error instanceof Error) {
      // When stdio: 'pipe', both stdout and stderr are mixed
      const output =
        (error as any).stdout || (error as any).stderr || error.message;
      diagnostics = parseTscDiagnostics(String(output), rootDir);
    }
  }

  // Filter to target files if provided (PAW gate mode)
  if (options?.files && options.files.length > 0) {
    diagnostics = filterDiagnosticsByFile(diagnostics, options.files);
  }

  // Categorize diagnostics by severity
  errorCount = diagnostics.filter((d) => d.category === 'error').length;
  warningCount = diagnostics.filter((d) => d.category === 'warning').length;

  // Convert diagnostics to CheckFailure format
  const failures: CheckFailure[] = diagnostics.map((d) => ({
    file: d.file,
    line: d.line,
    rule: d.code,
    message: d.message,
    severity: d.category === 'error' ? 'critical' : 'warning',
  }));

  const durationMs = Date.now() - startTime;
  const passed = errorCount === 0;
  const severity =
    errorCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'info';

  return {
    check: 'type-script-compilation',
    severity,
    passed,
    failures,
    stats: {
      total_files_checked:
        diagnostics.length > 0 ? (options?.files?.length ?? 1) : 0,
      violations_found: failures.length,
      errors: errorCount,
      warnings: warningCount,
      duration_ms: durationMs,
    },
  };
}

/**
 * Standalone entry point for direct execution.
 */
async function main(): Promise<void> {
  const result = await runCheck();
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.passed ? 0 : 1);
}

if (
  path.normalize(process.argv[1] ?? '') ===
  path.normalize(fileURLToPath(import.meta.url))
) {
  main().catch((err: Error) => {
    console.error('❌ Fatal:', err.message);
    process.exit(1);
  });
}
