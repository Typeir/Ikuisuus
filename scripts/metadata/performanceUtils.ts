/**
 * @fileoverview Performance Monitoring Utilities
 * @description Timer and memory profiling for metadata generators.
 *
 * @module lib/metadata/performanceUtils
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { createLogger } from '@/lib/logging/logger';

const log = createLogger({ component: 'metadata-perf' });

/**
 * Memory snapshot at timer start.
 *
 * @property {number} heapUsed - Heap memory in bytes
 * @property {number} external - External memory in bytes
 */
interface MemorySnapshot {
  heapUsed: number;
  external: number;
}

const timers = new Map<string, number>();
const memorySnapshots = new Map<string, MemorySnapshot>();

/**
 * Starts a performance timer and captures a memory snapshot.
 *
 * @param {string} label - Timer label
 */
export function startTimer(label: string): void {
  timers.set(label, performance.now());
  const mem = process.memoryUsage();
  memorySnapshots.set(label, {
    heapUsed: mem.heapUsed,
    external: mem.external,
  });
}

/**
 * Ends a performance timer, logs results, and returns elapsed time.
 *
 * @param {string} label - Timer label (must match a previous startTimer call)
 * @returns {number} Elapsed time in milliseconds (0 if timer not found)
 */
export function endTimer(label: string): number {
  const startTime = timers.get(label);
  const startMemory = memorySnapshots.get(label);

  if (startTime === undefined || !startMemory) {
    log.warning(`Timer '${label}' was not started`);
    return 0;
  }

  const elapsed = performance.now() - startTime;
  const currentMemory = process.memoryUsage();
  const heapDeltaMB =
    (currentMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024;

  log.message(
    `⏱️  ${label}: ${elapsed.toFixed(2)}ms (heap: ${heapDeltaMB.toFixed(2)}MB)`,
  );

  timers.delete(label);
  memorySnapshots.delete(label);

  return elapsed;
}
