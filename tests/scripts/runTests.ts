/**
 * Test runner wrapper that suppresses known deprecation warnings
 *
 * @fileoverview Wraps vitest execution to filter stderr for CJS deprecation warnings
 */

import { spawn } from 'child_process';

const vitest = spawn('vitest', ['run'], {
  stdio: ['inherit', 'inherit', 'pipe'],
  shell: true,
});

vitest.stderr.on('data', (data: Buffer) => {
  const output = data.toString();

  if (
    output.includes('CJS build of Vite') ||
    output.includes('vite-cjs-node-api-deprecated')
  ) {
    return;
  }

  process.stderr.write(data);
});

vitest.on('close', (code: number | null) => {
  process.exit(code ?? 1);
});
