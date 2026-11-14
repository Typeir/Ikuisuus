/**
 * @fileoverview builderActivity tests.
 *
 * @module tests/unit/src/modules/character-builder/application/builderCore/builderActivity.test
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import {
  beginBuilderTask,
  pendingBuilderTasks,
  subscribeBuilderActivity,
  trackBuilderTask,
} from '@/modules/character-builder/application/builderCore/builderActivity';
import { describe, expect, it, vi } from 'vitest';

describe('builderActivity', () => {
  it('counts a task until it resolves and notifies listeners', async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeBuilderActivity(listener);
    let resolve: (value: number) => void = () => undefined;
    const task = trackBuilderTask(new Promise<number>((r) => (resolve = r)));
    expect(pendingBuilderTasks()).toBe(1);
    resolve(5);
    await expect(task).resolves.toBe(5);
    expect(pendingBuilderTasks()).toBe(0);
    expect(listener.mock.calls.map((c) => c[0])).toEqual([1, 0]);
    unsubscribe();
  });

  it('opens and closes a manual task once', () => {
    const end = beginBuilderTask();
    expect(pendingBuilderTasks()).toBe(1);
    end();
    end();
    expect(pendingBuilderTasks()).toBe(0);
  });

  it('releases the count on rejection', async () => {
    await expect(trackBuilderTask(Promise.reject(new Error('x')))).rejects.toThrow('x');
    expect(pendingBuilderTasks()).toBe(0);
  });
});
