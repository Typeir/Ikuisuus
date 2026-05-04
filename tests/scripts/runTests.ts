/* paw:gate:antipatterns:console-log ignore */
/**
 * Test Runner — Parallel Project Orchestrator
 *
 * @fileoverview Runs vitest projects with bounded parallelism.
 * Each project gets its own process with bounded memory and concurrency controls.
 * Suppresses known CJS deprecation warnings from stderr.
 * Aggregates exit codes: fails if any project fails.
 *
 * @module runTests
 * @author Typeir
 * @version 1.1.0
 * @since 1.0.0
 */

import { spawn } from 'child_process';

const CI_PROJECT_CONCURRENCY = 2;
const LOCAL_PROJECT_CONCURRENCY = 3;

/** Project names matching vitest.config.ts `projects[].test.name` */
const PROJECTS = [
  'unit:components',
  'unit:utils:a',
  'unit:utils:b',
  'unit:utils:node',
  'unit:db:auth',
  'unit:db:orm',
  'unit:db:content:fs',
  'unit:db:content:pg',
  'unit:hooks',
  'unit:metadata',
  'unit:api',
  'unit:app:pages',
  'unit:app:utils',
  'unit:other',
  'integration',
];

const PROJECT_WEIGHTS: Record<string, number> = {
  'unit:components': 97,
  'unit:other': 54,
  'unit:utils:a': 22,
  'unit:utils:b': 17,
  'unit:utils:node': 5,
  'unit:db:content:fs': 22,
  'unit:db:content:pg': 20,
  'unit:db:orm': 19,
  'unit:db:auth': 14,
  'unit:api': 20,
  'unit:app:pages': 14,
  'unit:app:utils': 6,
  'unit:metadata': 16,
  'unit:hooks': 8,
  integration: 7,
};

type ProjectResult = { project: string; exitCode: number };

/**
 * Parse positive integer input.
 *
 * @param {string | undefined} value - Raw input value
 * @returns {number | undefined} Parsed positive integer, otherwise undefined
 */
function parsePositiveInteger(value: string | undefined): number | undefined {
  const parsed = Number.parseInt(value ?? '', 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

/**
 * Sort projects so heavier suites start first for better pipeline fill.
 *
 * @param {string[]} projects - Project names to sort
 * @returns {string[]} Sorted project names by descending estimated weight
 */
function sortProjectsByWeight(projects: string[]): string[] {
  return [...projects].sort(
    (left, right) =>
      (PROJECT_WEIGHTS[right] ?? 0) - (PROJECT_WEIGHTS[left] ?? 0),
  );
}

/**
 * Parse concurrency from command line and environment.
 *
 * @param {string[]} args - Command line arguments
 * @returns {number} Positive concurrency value
 */
function resolveConcurrency(args: string[]): number {
  const defaultConcurrency = process.env.CI
    ? CI_PROJECT_CONCURRENCY
    : LOCAL_PROJECT_CONCURRENCY;

  const envConcurrency = parsePositiveInteger(process.env.TEST_CONCURRENCY);

  let cliConcurrency: number | undefined;
  let useSequential = false;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === '--sequential') {
      useSequential = true;
      continue;
    }

    if (arg.startsWith('--concurrency=')) {
      cliConcurrency = parsePositiveInteger(arg.split('=')[1]);
      continue;
    }

    if (arg === '--concurrency') {
      cliConcurrency = parsePositiveInteger(args[i + 1]);
      i += 1;
    }
  }

  if (useSequential) {
    return 1;
  }

  if (cliConcurrency !== undefined) {
    return cliConcurrency;
  }

  if (envConcurrency !== undefined) {
    return envConcurrency;
  }

  return defaultConcurrency;
}

/**
 * Known stderr noise patterns to suppress.
 *
 * @param {string} output - Raw stderr string
 * @returns {boolean} True if output should be suppressed
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
 * @param {string} project - Project name from vitest.config.ts
 * @returns {Promise<number>} Promise resolving to exit code
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
 * Run projects with bounded parallelism.
 *
 * @param {string[]} projects - Project names to execute
 * @param {number} concurrency - Maximum number of concurrent project processes
 * @returns {Promise<ProjectResult[]>} Project results in input order
 */
async function runProjects(
  projects: string[],
  concurrency: number,
): Promise<ProjectResult[]> {
  const resultMap = new Map<string, number>();
  let index = 0;

  async function worker(): Promise<void> {
    while (true) {
      const currentIndex = index;
      index += 1;

      if (currentIndex >= projects.length) {
        return;
      }

      const project = projects[currentIndex];
      const exitCode = await runProject(project);
      resultMap.set(project, exitCode);
    }
  }

  const workerCount = Math.min(concurrency, projects.length);
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);

  return projects.map((project) => ({
    project,
    exitCode: resultMap.get(project) ?? 1,
  }));
}

/**
 * Main orchestrator.
 *
 * @returns {Promise<void>} Process completion signal
 */
async function main(): Promise<void> {
  const concurrency = resolveConcurrency(process.argv.slice(2));
  const projects = sortProjectsByWeight(PROJECTS);

  console.log(
    `🧪 Running ${projects.length} test projects with concurrency ${concurrency}...\n`,
  );

  const results = await runProjects(projects, concurrency);

  console.log(`\n${'═'.repeat(50)}`);
  console.log('📊 Test Results Summary');
  console.log('═'.repeat(50));

  const failed = results.filter((r) => r.exitCode !== 0);
  const passed = results.filter((r) => r.exitCode === 0);

  for (const r of results) {
    const icon = r.exitCode === 0 ? '✅' : '❌';
    console.log(`  ${icon} ${r.project}`);
  }

  console.log(`\n  Passed: ${passed.length}/${projects.length}`);

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
