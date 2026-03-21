#!/usr/bin/env npx tsx --tsconfig tsconfig.scripts.json

/**
 * Pre-Commit Security Hook
 *
 * @fileoverview Prevents accidental commits of sensitive artifacts
 * @module scripts/hooks/pre-commit
 * @version 1.0.0
 */

import { createLogger } from '@/lib/logging/logger';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

const log = createLogger({ script: 'pre-commit' });

/** Security match result */
interface PatternMatch {
  /** File path */
  file: string;
  /** Line number */
  line: number;
  /** Truncated line preview */
  preview: string;
}

/**
 * Loads base64-encoded patterns from the .patterns file
 *
 * @returns Decoded pattern strings
 */
function loadPatterns(): string[] {
  try {
    const projectRoot = process.cwd();
    const patternsFile = join(projectRoot, 'scripts/hooks/.patterns');
    const content = readFileSync(patternsFile, 'utf-8');
    return content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((encoded) => Buffer.from(encoded, 'base64').toString('utf-8'));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    log.error('❌ Error loading patterns file', { error: message });
    process.exit(1);
  }
}

const ENCODED_PATTERNS = loadPatterns();

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  '.next',
  'coverage',
  'build',
  '.backup',
  'scripts/hooks',
];

const CHECKED_EXTENSIONS = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.md',
  '.mdx',
  '.env',
  '.env.local',
  '.env.production',
  '.yml',
  '.yaml',
  '.toml',
  '.npmrc',
  '.gitignore',
  '.gitattributes',
  '.vercelignore',
  '.ps1',
  '.sh',
];

/**
 * Gets the list of staged files from git
 *
 * @returns Array of staged file paths
 */
function getStagedFiles(): string[] {
  try {
    const output = execSync('git diff --cached --name-only', {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    return output.split('\n').filter(Boolean);
  } catch {
    log.error('Error reading staged files');
    process.exit(1);
  }
}

/**
 * Returns newly added staged source files under src/ that should have tests.
 *
 * @returns {string[]} New source file paths from git index
 */
function getNewStagedSourceFiles(): string[] {
  try {
    const output = execSync('git diff --cached --name-status -- src/', {
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    return output
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split(/\s+/))
      .filter((parts) => parts[0] === 'A' && Boolean(parts[1]))
      .map((parts) => parts[1])
      .filter((filePath) => /\.(ts|tsx)$/.test(filePath))
      .filter(
        (filePath) =>
          !EXCLUDED_PATTERNS.some((pattern) => pattern.test(filePath)),
      );
  } catch {
    return [];
  }
}

const EXCLUDED_PATTERNS = [
  /\.d\.ts$/,
  /\.config\.(ts|js)$/,
  /\/index\.(ts|tsx)$/,
  /\.module\.(scss|css)$/,
  /\.stories\.(ts|tsx)$/,
  /\.test\.(ts|tsx)$/,
];

/**
 * Checks whether a source file has an accompanying unit or integration test file.
 *
 * @param {string} sourcePath - Relative source path (e.g., src/lib/utils/foo.ts)
 * @returns {boolean} True when at least one test file exists
 */
function hasMatchingTestFile(sourcePath: string): boolean {
  const ext = sourcePath.endsWith('.tsx') ? '.tsx' : '.ts';
  const baseName = sourcePath.replace(/\.(ts|tsx)$/, '');

  const unitPath = join(
    process.cwd(),
    'tests',
    'unit',
    `${baseName}.test${ext}`,
  );
  const integrationPath = join(
    process.cwd(),
    'tests',
    'integration',
    `${baseName}.test${ext}`,
  );

  try {
    readFileSync(unitPath, 'utf-8');
    return true;
  } catch {
    try {
      readFileSync(integrationPath, 'utf-8');
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Enforces test presence for newly added source files.
 *
 * @returns {number} Exit code (0 = pass, 1 = violations)
 */
function runNewFileTestGuard(): number {
  const newSourceFiles = getNewStagedSourceFiles();

  if (newSourceFiles.length === 0) {
    return 0;
  }

  const missing = newSourceFiles.filter(
    (sourcePath) => !hasMatchingTestFile(sourcePath),
  );

  if (missing.length === 0) {
    return 0;
  }

  const details = missing
    .map((sourcePath) => {
      const ext = sourcePath.endsWith('.tsx') ? '.tsx' : '.ts';
      const baseName = sourcePath.replace(/\.(ts|tsx)$/, '');
      return [
        `📄 ${sourcePath}`,
        `   → tests/unit/${baseName}.test${ext}`,
        `   → tests/integration/${baseName}.test${ext}`,
      ].join('\n');
    })
    .join('\n\n');

  log.error(
    '\n❌ NEW FILE TEST GUARD FAILED\n\n' +
      'Newly added source files are missing tests:\n\n' +
      details +
      '\n\nAdd at least one test file per new source file before committing.',
  );

  return 1;
}

/**
 * Checks if a file should be scanned for patterns
 *
 * @param filePath - Relative file path
 * @returns True if the file should be checked
 */
function shouldCheckFile(filePath: string): boolean {
  if (
    IGNORE_PATTERNS.some(
      (dir) => filePath.includes(`/${dir}/`) || filePath.includes(`\\${dir}\\`),
    )
  ) {
    return false;
  }
  return CHECKED_EXTENSIONS.some((ext) => filePath.endsWith(ext));
}

/**
 * Gets the staged content of a file
 *
 * @param filePath - Relative file path
 * @returns File content
 */
function getStagedFileContent(filePath: string): string {
  try {
    return execSync(`git show :${filePath}`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
  } catch {
    try {
      return readFileSync(filePath, 'utf-8');
    } catch {
      return '';
    }
  }
}

/**
 * Scans a file for restricted patterns
 *
 * @param filePath - File path
 * @param content - File content
 * @returns Match result or null
 */
function scanFileForPatterns(
  filePath: string,
  content: string,
): PatternMatch | null {
  const lines = content.split('\n');

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];

    for (const pattern of ENCODED_PATTERNS) {
      const regex = new RegExp(
        `\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
        'i',
      );
      if (regex.test(line)) {
        return {
          file: filePath,
          line: lineNum + 1,
          preview: line.substring(0, 80) + (line.length > 80 ? '...' : ''),
        };
      }
    }
  }

  return null;
}

/**
 * Runs security pattern checks on all staged files
 *
 * @returns Exit code (0 = clean, 1 = violations found)
 */
function runSecurityChecks(): number {
  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    return 0;
  }

  const matches: PatternMatch[] = [];

  for (const filePath of stagedFiles) {
    if (!shouldCheckFile(filePath)) {
      continue;
    }

    const content = getStagedFileContent(filePath);
    const match = scanFileForPatterns(filePath, content);

    if (match) {
      matches.push(match);
    }
  }

  if (matches.length === 0) {
    return 0;
  }

  const details = matches
    .map((match) => `📄 ${match.file}:${match.line}\n   ${match.preview}`)
    .join('\n');
  log.error(
    '\n❌ SECURITY CHECK FAILED\n\nStaged files contain restricted patterns:\n\n' +
      details +
      '\n\nPlease review these files before committing.',
  );

  return 1;
}

/**
 * Content submodule path (relative to repo root).
 * Staged files under this path should be committed in the content repo, not here.
 */
const SUBMODULE_PATH = 'src/content';

/**
 * Checks whether any staged files reside inside the content submodule directory.
 * If so, prints an error message and returns exit code 1.
 *
 * @returns 0 if clean, 1 if submodule files are staged
 */
function runSubmoduleGuard(): number {
  const stagedFiles = getStagedFiles();
  const submodulePrefix = SUBMODULE_PATH.replace(/\\/g, '/');
  const violations = stagedFiles.filter(
    (f) => f.startsWith(submodulePrefix + '/') || f === submodulePrefix,
  );

  if (violations.length === 0) {
    return 0;
  }

  const fileList = violations.map((file) => `  📄 ${file}`).join('\n');
  log.error(
    '\n❌ SUBMODULE GUARD FAILED\n\n' +
      'You have staged changes inside the content submodule (' +
      SUBMODULE_PATH +
      ').\n' +
      'Commit them in the content repo instead.\n\n' +
      fileList,
  );
  return 1;
}

const securityExit = runSecurityChecks();
if (securityExit !== 0) {
  process.exit(securityExit);
}

const newFileTestExit = runNewFileTestGuard();
if (newFileTestExit !== 0) {
  process.exit(newFileTestExit);
}

/* Skip the submodule guard when ik is coordinating both repos —
   ik intentionally stages src/content to update the submodule pointer. */
if (process.env.IK_RUNNING !== '1') {
  const submoduleExit = runSubmoduleGuard();
  process.exit(submoduleExit);
}
