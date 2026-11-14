/**
 * @fileoverview Pending-task counter that tells test hooks when builder async work is done.
 *
 * @module modules/character-builder/application/builderCore/builderActivity
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

type Listener = (pending: number) => void;

let pending = 0;
const listeners = new Set<Listener>();

/**
 * Notifies every listener of the pending count.
 *
 * @function emit
 * @returns {void}
 */
function emit(): void {
  for (const listener of listeners) listener(pending);
}

/**
 * Counts a promise as pending builder work until it settles.
 *
 * @function trackBuilderTask
 * @template T
 * @param {Promise<T>} task - Async builder work, e.g. a shard fetch
 * @returns {Promise<T>} The same promise
 */
export function trackBuilderTask<T>(task: Promise<T>): Promise<T> {
  pending += 1;
  emit();
  return task.finally(() => {
    pending = Math.max(0, pending - 1);
    emit();
  });
}

/**
 * Opens a pending builder task until the returned function runs.
 *
 * @function beginBuilderTask
 * @returns {() => void} Ends the task; extra calls do nothing
 */
export function beginBuilderTask(): () => void {
  pending += 1;
  emit();
  let open = true;
  return () => {
    if (!open) return;
    open = false;
    pending = Math.max(0, pending - 1);
    emit();
  };
}

/**
 * Returns the number of pending builder tasks.
 *
 * @function pendingBuilderTasks
 * @returns {number} Pending count (>= 0)
 */
export function pendingBuilderTasks(): number {
  return pending;
}

/**
 * Subscribes to pending-count changes.
 *
 * @function subscribeBuilderActivity
 * @param {Listener} listener - Called with the pending count on every change
 * @returns {() => void} Unsubscribe function
 */
export function subscribeBuilderActivity(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
