/**
 * Test Coverage Enforcement Script
 *
 * @fileoverview Validates that every source file has at least one corresponding test file.
 * Enforces namespace mirroring between src/ and tests/ directories.
 * Fails CI if any source file lacks test coverage.
 *
 * @module enforceCoverage
 * @version 1.0.0
 * @since 1.0.0
 *
 * @example
 * ```bash
 * npx tsx tests/scripts/enforceCoverage.ts
 * ```
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

const EXCLUDED_PATTERNS = [
  /\.d\.ts$/,
  /\.config\.(ts|js)$/,
  /\/index\.(ts|tsx)$/,
  /\.module\.(scss|css)$/,
  /\.stories\.(ts|tsx)$/,
];

/**
 * Recursively finds all TypeScript source files.
 *
 * @param dir - Directory to scan
 * @param fileList - Accumulator array
 * @returns Array of relative file paths
 */
async function findSourceFiles(
  dir: string,
  fileList: string[] = [],
): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await findSourceFiles(fullPath, fileList);
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      const relativePath = path.relative(ROOT, fullPath);

      if (!EXCLUDED_PATTERNS.some((pattern) => pattern.test(relativePath))) {
        fileList.push(relativePath);
      }
    }
  }

  return fileList;
}

/**
 * Searches for a corresponding test file.
 *
 * @param sourcePath - Relative path of the source file
 * @returns Full path to test file or null
 */
async function findTestFile(sourcePath: string): Promise<string | null> {
  const ext = path.extname(sourcePath);
  const baseName = sourcePath.replace(/\.(ts|tsx)$/, '');

  const possibleTestPaths = [
    path.join(ROOT, 'tests', 'unit', `${baseName}.test${ext}`),
    path.join(ROOT, 'tests', 'integration', `${baseName}.test${ext}`),
  ];

  for (const testPath of possibleTestPaths) {
    try {
      await fs.access(testPath);
      return testPath;
    } catch {
      continue;
    }
  }

  return null;
}

async function main(): Promise<void> {
  console.log('🔍 Enforcing test coverage...\n');

  const srcDir = path.join(ROOT, 'src');
  const sourceFiles = await findSourceFiles(srcDir);

  console.log(`📂 Found ${sourceFiles.length} source files to validate\n`);

  const missingTests: string[] = [];

  for (const sourceFile of sourceFiles) {
    const testFile = await findTestFile(sourceFile);

    if (!testFile) {
      missingTests.push(sourceFile);
    }
  }

  if (missingTests.length === 0) {
    console.log('✅ All source files have corresponding tests!');
    process.exit(0);
  }

  console.error(`❌ ${missingTests.length} source file(s) missing tests:\n`);

  for (const file of missingTests) {
    console.error(`  - ${file}`);

    const suggestedPath = file.replace(/\.(ts|tsx)$/, '.test.$1');
    console.error(`    → tests/unit/${suggestedPath}`);
    console.error(`    → tests/integration/${suggestedPath}\n`);
  }

  console.error(
    '\n💡 Create at least one test file for each missing source file.',
  );
  console.error('   Smoke tests are acceptable if the file is complex.\n');

  process.exit(1);
}

main().catch((error: unknown) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
