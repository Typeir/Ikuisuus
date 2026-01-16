/**
 * A simple reactive store for the currently active sidebar path.
 * Subscribers will be notified whenever the active path changes.
 */

type Callback = (path: string | null) => void;

class SidebarActivePathStore {
  private subscribers: Set<Callback> = new Set();
  private _value: string | null = null;

  /**
   * Subscribe to path changes.
   * @param {Callback} callback - Function to call on path updates.
   * @returns {() => void} Unsubscribe function.
   */
  subscribe(callback: Callback): () => void {
    this.subscribers.add(callback);
    // Immediately send current value
    callback(this._value);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Sets the new active path.
   * @param {string | null} path - The new path.
   */
  set(path: string | null): void {
    this._value = path;
    this.subscribers.forEach((cb) => cb(path));
  }
  /**
   * Returns the current subscriber count.
   * @returns {number | null} The current subscriber count.
   */
  getOpenCount(): number {
    return this.subscribers.size;
  }

  /**
   * Returns the current active path.
   * @returns {string | null} The active path.
   */
  get(): string | null {
    return this._value;
  }
}

export default SidebarActivePathStore;
