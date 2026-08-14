/**
 * @fileoverview Render Lifecycle — Phase-Based Frame Event System
 * @description Typed, priority-sorted observer system for the render loop.
 * Subscribers register for lifecycle phases and receive a shared FrameContext
 * with renderer, scene, camera, and frame timing. Phases execute each frame in
 * numeric order: PreUpdate, Update, PostUpdate, PreRender, PostRender.
 * @module worldSim/canvas/RenderLifecycle
 * @version 1.0.0
 * @author Typeir
 * @since 2.0.0
 */

import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three';

/**
 * Ordered lifecycle phases executed each frame.
 * Numeric values define execution order.
 *
 * @enum {number}
 */
export enum RenderPhase {
  /** @member {number} PreUpdate - Before simulation (input, physics prep) */
  PreUpdate = 0,
  /** @member {number} Update - Main simulation tick (orbits, renderers) */
  Update = 1,
  /** @member {number} PostUpdate - After simulation (camera, constraints) */
  PostUpdate = 2,
  /** @member {number} PreRender - Final scene mutations before WebGL draw */
  PreRender = 3,
  /** @member {number} PostRender - After WebGL draw (DOM overlays, gizmos) */
  PostRender = 4,
}

/**
 * Shared context passed to every lifecycle subscriber each frame.
 *
 * @interface FrameContext
 * @property {WebGLRenderer} renderer - The WebGL renderer (read pixels, draw to canvas)
 * @property {Scene} scene - The Three.js scene graph
 * @property {PerspectiveCamera} camera - The active camera
 * @property {HTMLCanvasElement} canvas - The renderer's DOM canvas element
 * @property {number} time - Accumulated simulation time in seconds (scaled by simulationSpeed)
 * @property {number} deltaTime - Wall-clock seconds since previous frame (clamped, unscaled)
 * @property {number} simDeltaTime - Simulation-scaled frame delta: `deltaTime * simulationSpeed`
 * @property {number} frame - Monotonic frame counter
 */
export interface FrameContext {
  /** @property {WebGLRenderer} renderer - The WebGL renderer */
  renderer: WebGLRenderer;
  /** @property {Scene} scene - The Three.js scene graph */
  scene: Scene;
  /** @property {PerspectiveCamera} camera - The active camera */
  camera: PerspectiveCamera;
  /** @property {HTMLCanvasElement} canvas - The renderer's canvas element */
  canvas: HTMLCanvasElement;
  /** @property {number} time - Accumulated simulation time in seconds (scaled by simulationSpeed) */
  time: number;
  /** @property {number} deltaTime - Wall-clock frame delta in seconds (clamped, unscaled — for camera and FPS) */
  deltaTime: number;
  /** @property {number} simDeltaTime - Simulation-scaled frame delta: deltaTime * simulationSpeed */
  simDeltaTime: number;
  /** @property {number} frame - Monotonic frame counter */
  frame: number;
}

/**
 * Callback signature for lifecycle subscribers.
 *
 * @typedef {Function} LifecycleCallback
 * @param {FrameContext} ctx - Shared frame context
 */
export type LifecycleCallback = (ctx: FrameContext) => void;

/**
 * Internal entry for a registered subscriber.
 *
 * @interface LifecycleEntry
 * @property {LifecycleCallback} callback - The subscriber function
 * @property {number} priority - Sort order within the phase (lower runs first)
 * @property {string} [label] - Optional debug label for profiling
 */
interface LifecycleEntry {
  /** @property {LifecycleCallback} callback - Subscriber function */
  callback: LifecycleCallback;
  /** @property {number} priority - Execution priority (lower = earlier) */
  priority: number;
  /** @property {string} [label] - Debug label */
  label?: string;
}

/** @constant {number} DEFAULT_PRIORITY - Default subscriber priority */
const DEFAULT_PRIORITY = 100;

/**
 * Phase-based render lifecycle manager. Manages ordered subscriber lists
 * for each render phase and dispatches a shared FrameContext each frame.
 *
 * @class RenderLifecycle
 *
 * @example
 * ```ts
 * const lifecycle = new RenderLifecycle();
 *
 * // Simulation runs in Update phase
 * lifecycle.on(RenderPhase.Update, (ctx) => {
 *   updateOrbits(ctx.time, ctx.deltaTime);
 * }, { priority: 10, label: 'orbits' });
 *
 * // DOM overlays run in PostRender (after WebGL draw)
 * lifecycle.on(RenderPhase.PostRender, (ctx) => {
 *   projectLabels(ctx.camera, ctx.canvas);
 * }, { label: 'labels' });
 *
 * // In the animation loop:
 * lifecycle.runPhase(RenderPhase.Update, frameContext);
 * renderer.render(scene, camera);
 * lifecycle.runPhase(RenderPhase.PostRender, frameContext);
 * ```
 */
export class RenderLifecycle {
  /** @property {Map} phases - Subscriber lists keyed by phase */
  private phases: Map<RenderPhase, LifecycleEntry[]> = new Map();

  /** @property {boolean} sortDirty - Whether any phase needs re-sorting */
  private sortDirty: boolean = false;

  /** @property {Set} dirtyPhases - Phases needing re-sort before next dispatch */
  private dirtyPhases: Set<RenderPhase> = new Set();

  /**
   * Subscribe to a lifecycle phase.
   *
   * @param {RenderPhase} phase - The phase to subscribe to
   * @param {LifecycleCallback} callback - Function called each frame during this phase
   * @param {object} [options] - Subscription options
   * @param {number} [options.priority=100] - Execution priority (lower runs first)
   * @param {string} [options.label] - Debug label for profiling
   * @returns {Function} Unsubscribe function
   */
  on(
    phase: RenderPhase,
    callback: LifecycleCallback,
    options?: { priority?: number; label?: string },
  ): () => void {
    const entry: LifecycleEntry = {
      callback,
      priority: options?.priority ?? DEFAULT_PRIORITY,
      label: options?.label,
    };

    if (!this.phases.has(phase)) {
      this.phases.set(phase, []);
    }

    this.phases.get(phase)!.push(entry);
    this.dirtyPhases.add(phase);
    this.sortDirty = true;

    return () => {
      const list = this.phases.get(phase);
      if (!list) return;
      const idx = list.indexOf(entry);
      if (idx !== -1) {
        list.splice(idx, 1);
      }
    };
  }

  /**
   * Execute all subscribers for a specific phase in priority order.
   *
   * @param {RenderPhase} phase - The phase to execute
   * @param {FrameContext} ctx - Shared frame context
   */
  runPhase(phase: RenderPhase, ctx: FrameContext): void {
    if (this.sortDirty && this.dirtyPhases.has(phase)) {
      this.sortPhase(phase);
    }

    const list = this.phases.get(phase);
    if (!list || list.length === 0) return;

    for (let i = 0; i < list.length; i++) {
      list[i].callback(ctx);
    }
  }

  /**
   * Execute all pre-render phases in order: PreUpdate → Update → PostUpdate → PreRender.
   *
   * @param {FrameContext} ctx - Shared frame context
   */
  runPreRenderPhases(ctx: FrameContext): void {
    this.runPhase(RenderPhase.PreUpdate, ctx);
    this.runPhase(RenderPhase.Update, ctx);
    this.runPhase(RenderPhase.PostUpdate, ctx);
    this.runPhase(RenderPhase.PreRender, ctx);
  }

  /**
   * Execute all post-render phases in order. Currently only PostRender.
   *
   * @param {FrameContext} ctx - Shared frame context
   */
  runPostRenderPhases(ctx: FrameContext): void {
    this.runPhase(RenderPhase.PostRender, ctx);
  }

  /**
   * Get the count of subscribers for a specific phase.
   *
   * @param {RenderPhase} phase - The phase to query
   * @returns {number} Number of subscribers
   */
  subscriberCount(phase: RenderPhase): number {
    return this.phases.get(phase)?.length ?? 0;
  }

  /**
   * Remove all subscribers from all phases.
   */
  clear(): void {
    this.phases.clear();
    this.dirtyPhases.clear();
    this.sortDirty = false;
  }

  /**
   * Sort a phase's subscriber list by priority (lower first).
   *
   * @private
   * @param {RenderPhase} phase - Phase to sort
   */
  private sortPhase(phase: RenderPhase): void {
    const list = this.phases.get(phase);
    if (list && list.length > 1) {
      list.sort((a, b) => a.priority - b.priority);
    }
    this.dirtyPhases.delete(phase);
    if (this.dirtyPhases.size === 0) {
      this.sortDirty = false;
    }
  }
}
