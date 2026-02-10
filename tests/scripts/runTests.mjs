/**
 * Test runner wrapper that suppresses known deprecation warnings
 * @fileoverview Wraps vitest execution to filter stderr for CJS deprecation warnings
 */

import { spawn } from 'child_process';

const vitest = spawn('vitest', ['run'], {
  stdio: ['inherit', 'inherit', 'pipe'],
  shell: true,
});

vitest.stderr.on('data', (data) => {
  const output = data.toString();
  
  // Filter out known deprecation warnings
  if (
    output.includes('CJS build of Vite') ||
    output.includes('vite-cjs-node-api-deprecated')
  ) {
    return; // suppress
  }
  
  // Pass through other stderr
  process.stderr.write(data);
});

vitest.on('close', (code) => {
  process.exit(code);
});
