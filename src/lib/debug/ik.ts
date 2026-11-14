/**
 * @fileoverview Global Debug Namespace — window.ik
 * @description Runtime debug namespace for subsystems.
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
   * Maximum `deltaTime` per frame (seconds).
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
   * Simulation speed multiplier.
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
  /** Character builder test hooks — registered while a sheet is mounted and the dev builder flag is on */
  builder: IkBuilderDebug;
}

/**
 * `window.ik.builder` — dev-only character builder hooks against live UI state.
 *
 * @interface IkBuilderDebug
 * @property {() => import('@/lib/types/character').CharacterSheet} getCharacter - Displayed character (draft while editing)
 * @property {(carry?: import('@/modules/character-builder/application/builderCore/types').CarryOptions) => import('@/modules/character-builder/application/builderCore/builderState').BuilderState} getState - Computed state
 * @property {(carry?: import('@/modules/character-builder/application/builderCore/types').CarryOptions) => import('@/modules/character-builder/application/builderCore/types').BuilderFlag[]} getFlags - Advisory flags
 * @property {(patch: Partial<import('@/lib/types/character').CharacterSheet>) => Promise<import('@/modules/character-builder/application/builderCore/types').BuilderSnapshot & { diff: unknown }>} patch - Merges a patch through the sheet mutators, waits for settle, returns snapshot and diff
 * @property {(character: import('@/lib/types/character').CharacterSheet) => Promise<import('@/modules/character-builder/application/builderCore/types').BuilderSnapshot>} load - Upserts and activates a character, waits for settle
 * @property {(payload: import('@/modules/character-builder/application/builderCore/types').BuilderPayload, options?: { locale?: string; threshold?: number }) => Promise<unknown>} create - Builds via the dev API, loads the result, waits for settle
 * @property {(slot: import('@/modules/character-builder/application/builderCore/types').BuilderSlot, vocationIndex?: number) => Promise<unknown>} options - Lists slot options for the displayed character via the dev API
 * @property {() => void} edit - Enters edit mode
 * @property {() => void} save - Saves and leaves edit mode
 * @property {() => void} cancel - Discards edits
 * @property {() => boolean} isSettled - True when no builder task is pending and state is quiet
 * @property {(timeoutMs?: number) => Promise<void>} whenSettled - Resolves once settled; rejects after the timeout (default 10000)
 */
export interface IkBuilderDebug {
  getCharacter: () => import('@/lib/types/character').CharacterSheet;
  getState: (
    carry?: import('@/modules/character-builder/application/builderCore/types').CarryOptions,
  ) => import('@/modules/character-builder/application/builderCore/builderState').BuilderState;
  getFlags: (
    carry?: import('@/modules/character-builder/application/builderCore/types').CarryOptions,
  ) => import('@/modules/character-builder/application/builderCore/types').BuilderFlag[];
  patch: (
    patch: Partial<import('@/lib/types/character').CharacterSheet>,
  ) => Promise<
    import('@/modules/character-builder/application/builderCore/types').BuilderSnapshot & {
      diff: unknown;
    }
  >;
  load: (
    character: import('@/lib/types/character').CharacterSheet,
  ) => Promise<import('@/modules/character-builder/application/builderCore/types').BuilderSnapshot>;
  create: (
    payload: import('@/modules/character-builder/application/builderCore/types').BuilderPayload,
    options?: { locale?: string; threshold?: number },
  ) => Promise<unknown>;
  options: (
    slot: import('@/modules/character-builder/application/builderCore/types').BuilderSlot,
    vocationIndex?: number,
  ) => Promise<unknown>;
  edit: () => void;
  save: () => void;
  cancel: () => void;
  isSettled: () => boolean;
  whenSettled: (timeoutMs?: number) => Promise<void>;
}

/**
 * `window.ik.ui` — persistent UI preferences, live.
 *
 * @interface IkUiDebug
 * @property {'compact' | 'verbose' | 'glyph'} aspectDisplay - RW.
 * @property {boolean} aspectExpanded - RW.
 * @property {'dark' | 'light'} theme - RW.
 */
export interface IkUiDebug {
  aspectDisplay: 'compact' | 'verbose' | 'glyph';
  aspectExpanded: boolean;
  theme: 'dark' | 'light';
}

/**
 * Root `window.ik` namespace.
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
    /** Global Ikuisuus debug namespace. */
    ik: IkNamespace;
  }
}

/**
 * Initialise and return `window.ik`.
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
 * Register debug module under `window.ik[key]`.
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
