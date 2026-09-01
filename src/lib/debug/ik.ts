/**
 * @fileoverview Global Debug Namespace — window.ik
 * @description Runtime debug namespace for subsystems. Subsystems register modules under short keys.
 *
 * @example Console usage
 * ```js
 * window.ik.ws.deltaTimeCap        // read current clamp
 * window.ik.ws.deltaTimeCap = 0.5  // loosen for testing
 * window.ik.ws.fps                 // check instantaneous FPS
 * ```
 *
 * @module lib/debug/ik
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
   * Maximum `deltaTime` per frame (seconds). Clamped [1/120, 1], default 1/15.
   *
   * @type {number}
   * @example window.ik.ws.deltaTimeCap = 1 / 30
   */
  deltaTimeCap: number;

  /**
   * Frames-per-second for last frame (read-only).
   *
   * @type {number}
   * @readonly
   */
  readonly fps: number;

  /**
   * Accumulated simulation time (seconds, read-only).
   *
   * @type {number}
   * @readonly
   */
  readonly time: number;

  /**
   * Simulation speed multiplier. Default 1, clamped [0, 1000]. 0 freezes.
   *
   * @type {number}
   * @example window.ik.ws.simulationSpeed = 50
   */
  simulationSpeed: number;

  /**
   * Animation loop running (read-only).
   *
   * @type {boolean}
   * @readonly
   */
  readonly running: boolean;
}

/**
 * Maps short module keys to debug interfaces.
 *
 * @interface IkModules
 */
export interface IkModules {
  /** World Sim module — registered when WorldSim mounts */
  ws: IkWorldSimDebug;
  /** Persistent UI preferences — registered while PersistentUiProvider is mounted */
  ui: IkUiDebug;
}

/**
 * `window.ik.ui` — persistent UI preferences, live.
 *
 * @interface IkUiDebug
 * @property {'compact' | 'verbose' | 'glyph'} aspectDisplay - RW. How aspect pills render: icon+value, icon+group:value, glyph only.
 * @property {boolean} aspectExpanded - RW. Whether aspect carousels stay unpacked.
 * @property {'dark' | 'light'} theme - RW. Active theme.
 */
export interface IkUiDebug {
  aspectDisplay: 'compact' | 'verbose' | 'glyph';
  aspectExpanded: boolean;
  theme: 'dark' | 'light';
}

/**
 * Root `window.ik` namespace. Modules optional.
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
 * Initialise and return `window.ik`. Returns stub in non-browser environments.
 *
 * @function ensureIkNamespace
 * @returns {IkNamespace} The `window.ik` namespace
 */
export function ensureIkNamespace(): IkNamespace {
  if (typeof window === 'undefined') return {};
  if (!window.ik) window.ik = {};
  return window.ik;
}

/**
 * Register debug module under `window.ik[key]`. Overwrites previous registration.
 *
 * @template K
 * @function registerIkModule
 * @param {K} key - Module key (e.g. `'ws'`)
 * @param {IkModules[K]} module - Debug object to expose
 */
export function registerIkModule<K extends keyof IkModules>(
  key: K,
  module: IkModules[K],
): void {
  const ns = ensureIkNamespace();
  ns[key] = module;
}

/**
 * Remove debug module from `window.ik[key]`.
 *
 * @template K
 * @function unregisterIkModule
 * @param {K} key - Module key to remove
 */
export function unregisterIkModule<K extends keyof IkModules>(key: K): void {
  const ns = ensureIkNamespace();
  delete ns[key];
}
