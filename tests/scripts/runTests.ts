/**
 * Test Runner — Sequential Project Orchestrator
 *
 * @fileoverview Runs each vitest project sequentially to prevent OOM crashes.
 * Each project gets its own forked process with bounded memory.
 * Suppresses known CJS deprecation warnings from stderr.
 * Aggregates exit codes: fails if any project fails.
 */

import { spawn } from 'child_process';

/** Project names matching vitest.config.ts `projects[].test.name` */
const PROJECTS = [
  'unit:components',
  'unit:utils',
  'unit:db',
  'unit:hooks',
  'unit:metadata',
  'unit:api',
  'unit:app',
  'unit:other',
  'integration',
];

/**
 * Known stderr noise patterns to suppress.
 *
 * @param output - Raw stderr string
 * @returns True if output should be suppressed
 */
function isSuppressedStderr(output: string): boolean {
  return (
    output.includes('CJS build of Vite') ||
    output.includes('vite-cjs-node-api-deprecated')
  );
}

/**
 * Run a single vitest project and return exit code.
 *
 * @param project - Project name from vitest.config.ts
 * @returns Promise resolving to exit code
 */
function runProject(project: string): Promise<number> {
  return new Promise((resolve) => {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`▶ Running project: ${project}`);
    console.log('─'.repeat(50));

    const child = spawn('vitest', ['run', '--project', project], {
      stdio: ['inherit', 'inherit', 'pipe'],
      shell: true,
    });

    child.stderr.on('data', (data: Buffer) => {
      const output = data.toString();
      if (!isSuppressedStderr(output)) {
        process.stderr.write(data);
      }
    });

    child.on('close', (code: number | null) => {
      const exitCode = code ?? 1;
      if (exitCode === 0) {
        console.log(`✅ ${project} — passed`);
      } else {
        console.log(`❌ ${project} — failed (exit ${exitCode})`);
      }
      resolve(exitCode);
    });
  });
}

/**
 * Main orchestrator — runs all projects sequentially.
 */
async function main(): Promise<void> {
  console.log(`🧪 Running ${PROJECTS.length} test projects sequentially...\n`);

  const results: Array<{ project: string; exitCode: number }> = [];

  for (const project of PROJECTS) {
    const exitCode = await runProject(project);
    results.push({ project, exitCode });
  }

  console.log(`\n${'═'.repeat(50)}`);
  console.log('📊 Test Results Summary');
  console.log('═'.repeat(50));

  const failed = results.filter((r) => r.exitCode !== 0);
  const passed = results.filter((r) => r.exitCode === 0);

  for (const r of results) {
    const icon = r.exitCode === 0 ? '✅' : '❌';
    console.log(`  ${icon} ${r.project}`);
  }

  console.log(`\n  Passed: ${passed.length}/${PROJECTS.length}`);

  if (failed.length > 0) {
    console.log(`  Failed: ${failed.map((f) => f.project).join(', ')}`);
    process.exit(1);
  }

  process.exit(0);
}

main().catch((error: unknown) => {
  console.error('❌ Fatal error in test runner:', error);
  process.exit(1);
});
