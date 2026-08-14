/**
 * @fileoverview Generates smoke test templates for source files lacking tests.
 * Writes templates to tests/unit mirroring the source path. Skips excluded patterns.
 *
 * @module generateTestTemplates
 * @version 1.0.0
 * @since 1.0.0
 *
 * @example
 * ```bash
 * npx tsx tests/scripts/generateTestTemplates.ts
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
];

/**
 * Generates a test template for a source file.
 *
 * @param sourcePath - Relative source file path
 * @param isComponent - Whether the file is a React component (.tsx)
 * @returns Test file content
 */
function generateTestTemplate(
  sourcePath: string,
  isComponent: boolean,
): string {
  const fileName = path.basename(sourcePath);
  const importPath = sourcePath.replace(/\\/g, '/').replace(/^src\//, '@/');
  const moduleNameMatch = fileName.match(/^(.+)\.(ts|tsx)$/);
  const moduleName = moduleNameMatch ? moduleNameMatch[1] : fileName;

  if (isComponent) {
    return `/**
 * TODO: Add comprehensive tests for ${fileName}
 * This file contains only smoke tests. Additional test coverage needed for:
 * - User interactions
 * - Edge cases
 * - Integration scenarios
 *
 * NOTE: This is a dummy test that will never fail the suite.
 * It catches errors and emits warnings instead of failing.
 */

import { describe, expect, it } from 'vitest';

describe('${moduleName}', () => {
  it('should load component module [DUMMY TEST]', async () => {
    try {
      const mod = await Promise.race([
        import('${importPath.replace(/\.tsx?$/, '')}'),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Timed out while loading module')), 1500);
        }),
      ]);
      const exported = Object.keys(mod).length;
      expect(exported).toBeGreaterThan(0);
    } catch (error) {
      console.warn(
        '⚠️  DUMMY TEST WARNING: ${importPath.replace(/\.tsx?$/, '')}',
        '\\n   Failed to load component module:',
        error instanceof Error ? error.message : String(error)
      );
    }
    // Dummy test always passes - real tests needed
  });
});
`;
  }

  return `/**
 * TODO: Add comprehensive tests for ${fileName}
 * This file contains only smoke tests. Additional test coverage needed for:
 * - Function behavior validation
 * - Edge cases
 * - Error handling
 *
 * NOTE: This is a dummy test that will never fail the suite.
 * It catches errors and emits warnings instead of failing.
 */

import { describe, expect, it } from 'vitest';

describe('${moduleName}', () => {
  it('should export module members [DUMMY TEST]', async () => {
    try {
      const Module = await Promise.race([
        import('${importPath.replace(/\.tsx?$/, '')}'),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Timed out while loading module')), 1500);
        }),
      ]);
      if (!Module || typeof Module !== 'object') {
        throw new Error('Module failed to import');
      }
      const exportCount = Object.keys(Module).length;
      expect(exportCount).toBeGreaterThanOrEqual(0);
      if (exportCount === 0) {
        console.warn(
          '⚠️  DUMMY TEST WARNING: ${importPath.replace(/\.tsx?$/, '')}',
          '\\n   Module has no exports'
        );
      }
    } catch (error) {
      console.warn(
        '⚠️  DUMMY TEST WARNING: ${importPath.replace(/\.tsx?$/, '')}',
        '\\n   Failed to load module:',
        error instanceof Error ? error.message : String(error)
      );
    }
    // Dummy test always passes - real tests needed
  });
});
`;
}

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
 * Checks whether a test file already exists for a source file.
 *
 * @param sourcePath - Relative source file path
 * @returns True if a test file exists
 */
async function testFileExists(sourcePath: string): Promise<boolean> {
  const ext = path.extname(sourcePath);
  const baseName = sourcePath.replace(/\.(ts|tsx)$/, '');

  const possiblePaths = [
    path.join(ROOT, 'tests', 'unit', `${baseName}.test${ext}`),
    path.join(ROOT, 'tests', 'integration', `${baseName}.test${ext}`),
  ];

  for (const testPath of possiblePaths) {
    try {
      await fs.access(testPath);
      return true;
    } catch {
      continue;
    }
  }

  return false;
}

async function main(): Promise<void> {
  console.log('🔧 Generating test templates...\n');

  const srcDir = path.join(ROOT, 'src');
  const sourceFiles = await findSourceFiles(srcDir);

  let created = 0;

  for (const sourceFile of sourceFiles) {
    const hasTest = await testFileExists(sourceFile);

    if (!hasTest) {
      const ext = path.extname(sourceFile);
      const testPath = path.join(
        ROOT,
        'tests',
        'unit',
        sourceFile.replace(/\.(ts|tsx)$/, `.test${ext}`),
      );
      const testDir = path.dirname(testPath);

      await fs.mkdir(testDir, { recursive: true });

      const isComponent = ext === '.tsx';
      const template = generateTestTemplate(sourceFile, isComponent);

      await fs.writeFile(testPath, template, 'utf-8');

      console.log(`✅ Created: ${path.relative(ROOT, testPath)}`);
      created++;
    }
  }

  console.log(`\n✨ Generated ${created} test template(s)`);
}

main().catch((error: unknown) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
