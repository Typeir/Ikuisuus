/**
 * @fileoverview Global Debug Namespace — window.ik
 * @description Defines and initialises the `window.ik` runtime debug namespace.
 * Each subsystem registers its own module under a short key
 * (`window.ik.ws` for World Sim, populated when WorldSim mounts) via
 * `registerIkModule`. Modules are typed through the `IkModules` interface.
 *
 * @example Console usage
 * ```js
 * window.ik.ws.deltaTimeCap        // read current clamp
 * window.ik.ws.deltaTimeCap = 0.5  // loosen for testing
 * window.ik.ws.fps                 // check instantaneous FPS
 * ```
 *
 * @module debug/ik
 * @version 1.0.0
 * @author Typeir
 * @since 2026-05-21
 */

/**
 * Debug controls and read-only probes for the World Sim (window.ik.ws).
 *
 * @interface IkWorldSimDebug
 */
export interface IkWorldSimDebug {
  /**
   * Maximum `deltaTime` allowed per frame in seconds.
   * Clamped internally to the range [1/120, 1].
   * Default: `1/15` (~66 ms, a 15 fps floor).
   *
   * @type {number}
   * @example window.ik.ws.deltaTimeCap = 1 / 30
   */
  deltaTimeCap: number;

  /**
   * Approximate frames-per-second for the last rendered frame (read-only).
   * Computed as `1 / deltaTime` before clamping.
   *
   * @type {number}
   * @readonly
   */
  readonly fps: number;

  /**
   * Accumulated simulation time in seconds since the loop started.
   * Advances at `deltaTime * simulationSpeed` each frame (read-only).
   *
   * @type {number}
   * @readonly
   */
  readonly time: number;

  /**
   * Simulation speed multiplier. Default `1` (real-time).
   * `0` freezes the simulation. Clamped to [0, 1000].
   * Affects orbital positions, shader animations, and mesh rotations.
   *
   * @type {number}
   * @example window.ik.ws.simulationSpeed = 50
   */
  simulationSpeed: number;

  /**
   * Whether the animation loop is currently running (read-only).
   *
   * @type {boolean}
   * @readonly
   */
  readonly running: boolean;
}

/**
 * Maps short module keys to their debug interface. Extend via declaration
 * merging in the module's own file when adding a new module.
 *
 * @interface IkModules
 */
export interface IkModules {
  /** World Sim module — registered when WorldSim mounts */
  ws: IkWorldSimDebug;
}

/**
 * The root `window.ik` namespace object.
 * Modules are optional so the namespace is safe to inspect at any lifecycle stage.
 *
 * @interface IkNamespace
 */
export type IkNamespace = Partial<IkModules>;

declare global {
  /**
   * Extended Window interface to include the `ik` debug namespace.
   *
   * @interface Window
   * @property {IkNamespace} ik - Global Ikuisuus debug namespace
   */
  interface Window {
    /** Global Ikuisuus debug namespace. Use `window.ik.ws` for World Sim controls. */
    ik: IkNamespace;
  }
}

/**
 * Lazily initialise `window.ik` and return it. In non-browser
 * environments returns a detached stub object.
 *
 * @function ensureIkNamespace
 * @returns {IkNamespace} The `window.ik` namespace object
 */
export function ensureIkNamespace(): IkNamespace {
  if (typeof window === 'undefined') return {};
  if (!window.ik) window.ik = {};
  return window.ik;
}

/**
 * Register a debug module under `window.ik[key]`. Creates `window.ik` if
 * needed. Overwrites any previous registration under the same key (safe to
 * re-register on hot-reload).
 *
 * @template K
 * @function registerIkModule
 * @param {K} key - Short module key (e.g. `'ws'`)
 * @param {IkModules[K]} module - The debug object to expose
 */
export function registerIkModule<K extends keyof IkModules>(
  key: K,
  module: IkModules[K],
): void {
  const ns = ensureIkNamespace();
  ns[key] = module;
}

/**
 * Remove a debug module from `window.ik[key]`. Called on module unmount so
 * stale references do not linger after cleanup.
 *
 * @template K
 * @function unregisterIkModule
 * @param {K} key - Short module key to remove
 */
export function unregisterIkModule<K extends keyof IkModules>(key: K): void {
  const ns = ensureIkNamespace();
  delete ns[key];
}
