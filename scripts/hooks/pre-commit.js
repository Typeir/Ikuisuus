#!/usr/bin/env node

/**
 * Pre-Commit Security Hook
 *
 * @fileoverview Prevents accidental commits of sensitive artifacts
 * @module scripts/hooks/pre-commit
 * @version 1.0.0
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { createLogger } = require('../core/logger.cjs');
const log = createLogger({ script: 'pre-commit' });

function loadPatterns() {
  try {
    const projectRoot = process.cwd();
    const patternsFile = path.join(projectRoot, 'scripts/hooks/.patterns');
    const content = fs.readFileSync(patternsFile, 'utf-8');
    return content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((encoded) => Buffer.from(encoded, 'base64').toString('utf-8'));
  } catch (error) {
    log.error('❌ Error loading patterns file', { error: error.message });
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

function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only', {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    return output.split('\n').filter(Boolean);
  } catch (error) {
    log.error('Error reading staged files');
    process.exit(1);
  }
}

function shouldCheckFile(filePath) {
  if (
    IGNORE_PATTERNS.some(
      (dir) => filePath.includes(`/${dir}/`) || filePath.includes(`\\${dir}\\`),
    )
  ) {
    return false;
  }
  return CHECKED_EXTENSIONS.some((ext) => filePath.endsWith(ext));
}

function getStagedFileContent(filePath) {
  try {
    return execSync(`git show :${filePath}`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
  } catch (error) {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch {
      return '';
    }
  }
}

function scanFileForPatterns(filePath, content) {
  const lines = content.split('\n');

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];

    for (const pattern of ENCODED_PATTERNS) {
      if (line.toLowerCase().includes(pattern.toLowerCase())) {
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

function runSecurityChecks() {
  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    return 0;
  }

  const matches = [];

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
 * @returns {number} 0 if clean, 1 if submodule files are staged
 */
function runSubmoduleGuard() {
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

/* Skip the submodule guard when ik is coordinating both repos —
   ik intentionally stages src/content to update the submodule pointer. */
if (process.env.IK_RUNNING !== '1') {
  const submoduleExit = runSubmoduleGuard();
  process.exit(submoduleExit);
}
