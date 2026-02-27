/**
 * @fileoverview Projection Bridge — 3D to 2D Adapter
 * @description Projects tracked 3D world positions to 2D screen coordinates each frame.
 * Uses a subscriber pattern so DOM elements can track 3D points via ref mutations,
 * avoiding React re-render storms for 60fps performance.
 *
 * @module worldSim/bridge/ProjectionBridge
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { PerspectiveCamera, Vector3 } from 'three';

import type { ProjectedPosition } from '../celestials/interfaces';

/** @constant {number} MAX_LABEL_DISTANCE - Beyond this distance, scale is clamped to minimum */
const MAX_LABEL_DISTANCE = 2000;

/** @constant {number} MIN_LABEL_DISTANCE - Closer than this, scale is clamped to maximum */
const MIN_LABEL_DISTANCE = 50;

/** @constant {number} MAX_SCALE - Maximum DOM element scale factor */
const MAX_SCALE = 1.5;

/** @constant {number} MIN_SCALE - Minimum DOM element scale factor */
const MIN_SCALE = 0.3;

/**
 * Callback type for per-point position update subscribers.
 * @typedef {Function} PositionSubscriber
 */
type PositionSubscriber = (pos: ProjectedPosition) => void;

/**
 * Callback type for global all-positions update subscribers.
 * @typedef {Function} GlobalPositionSubscriber
 */
type GlobalPositionSubscriber = (
  positions: Map<string, ProjectedPosition>,
) => void;

/**
 * Projects 3D world-space points to 2D screen coordinates.
 * Manages tracked points and notifies subscribers of position changes each frame.
 *
 * Performance note: Updates happen via direct callback (not React state) so overlay
 * DOM elements can apply CSS transforms without triggering re-renders.
 *
 * @class ProjectionBridge
 *
 * @example
 * ```ts
 * const bridge = new ProjectionBridge();
 * bridge.track('damocles', new Vector3(400, 0, 0));
 * bridge.subscribe('damocles', (pos) => {
 *   element.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
 * });
 * // In animation loop:
 * bridge.update(camera, canvas.getBoundingClientRect());
 * ```
 */
export class ProjectionBridge {
  /** @property {Map} trackedPoints - 3D world positions keyed by entity ID */
  private trackedPoints: Map<string, Vector3> = new Map();

  /** @property {Map} projectedPositions - Latest projected 2D positions */
  private projectedPositions: Map<string, ProjectedPosition> = new Map();

  /** @property {Map} subscribers - Sets of callbacks per entity ID */
  private subscribers: Map<string, Set<PositionSubscriber>> = new Map();

  /** @property {Set} globalSubscribers - Callbacks receiving all positions each frame */
  private globalSubscribers: Set<GlobalPositionSubscriber> = new Set();

  /** @property {Vector3} tempVec - Reusable vector to avoid allocations in hot loop */
  private tempVec: Vector3 = new Vector3();

  /**
   * Begin tracking a 3D world position for projection.
   *
   * @param {string} id - Unique identifier for the tracked point
   * @param {Vector3} worldPosition - 3D world-space position
   */
  track(id: string, worldPosition: Vector3): void {
    this.trackedPoints.set(id, worldPosition);
  }

  /**
   * Stop tracking a point and remove its subscribers.
   *
   * @param {string} id - Identifier of the point to untrack
   */
  untrack(id: string): void {
    this.trackedPoints.delete(id);
    this.projectedPositions.delete(id);
    this.subscribers.delete(id);
  }

  /**
   * Update the world position of an already-tracked point.
   *
   * @param {string} id - Identifier of the tracked point
   * @param {Vector3} worldPosition - New 3D world-space position
   */
  updatePosition(id: string, worldPosition: Vector3): void {
    const existing = this.trackedPoints.get(id);
    if (existing) {
      existing.copy(worldPosition);
    } else {
      this.track(id, worldPosition.clone());
    }
  }

  /**
   * Subscribe to projected position updates for a specific point.
   *
   * @param {string} id - Identifier of the tracked point
   * @param {PositionSubscriber} callback - Called each frame with new projected position
   * @returns {Function} Unsubscribe function
   */
  subscribe(id: string, callback: PositionSubscriber): () => void;

  /**
   * Subscribe to all projected position updates at once.
   *
   * @param {GlobalPositionSubscriber} callback - Called each frame with all projected positions
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback: GlobalPositionSubscriber): () => void;

  /**
   * Subscribe overload implementation.
   *
   * @param {string | GlobalPositionSubscriber} idOrCallback - Point ID or global callback
   * @param {PositionSubscriber} [callback] - Per-point callback (when first arg is ID)
   * @returns {Function} Unsubscribe function
   */
  subscribe(
    idOrCallback: string | GlobalPositionSubscriber,
    callback?: PositionSubscriber,
  ): () => void {
    if (typeof idOrCallback === 'function') {
      this.globalSubscribers.add(idOrCallback);
      return () => {
        this.globalSubscribers.delete(idOrCallback);
      };
    }

    const id = idOrCallback;
    if (!callback) {
      throw new Error('Callback required when subscribing to a specific point');
    }

    if (!this.subscribers.has(id)) {
      this.subscribers.set(id, new Set());
    }
    this.subscribers.get(id)!.add(callback);

    return () => {
      const subs = this.subscribers.get(id);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(id);
        }
      }
    };
  }

  /**
   * Project all tracked points and notify subscribers.
   * Called once per frame from the animation loop — hot path.
   *
   * @param {PerspectiveCamera} camera - The scene camera
   * @param {DOMRect} canvasRect - Bounding rect of the Three.js canvas element
   */
  update(camera: PerspectiveCamera, canvasRect: DOMRect): void {
    const entries = Array.from(this.trackedPoints.entries());
    for (let i = 0; i < entries.length; i++) {
      const [id, worldPos] = entries[i];
      this.tempVec.copy(worldPos).project(camera);

      const x = (this.tempVec.x * 0.5 + 0.5) * canvasRect.width;
      const y = (-this.tempVec.y * 0.5 + 0.5) * canvasRect.height;
      const visible = this.tempVec.z > 0 && this.tempVec.z < 1;
      const distance = camera.position.distanceTo(worldPos);
      const scale = this.distanceToScale(distance);

      const pos: ProjectedPosition = { x, y, visible, distance, scale };
      this.projectedPositions.set(id, pos);
      this.notifySubscribers(id, pos);
    }

    this.notifyGlobalSubscribers();
  }

  /**
   * Get the last projected position for a point without subscribing.
   *
   * @param {string} id - Identifier of the tracked point
   * @returns {ProjectedPosition | undefined} Last projected position, or undefined
   */
  getPosition(id: string): ProjectedPosition | undefined {
    return this.projectedPositions.get(id);
  }

  /**
   * Get all currently tracked point IDs.
   *
   * @returns {string[]} Array of tracked point identifiers
   */
  getTrackedIds(): string[] {
    return Array.from(this.trackedPoints.keys());
  }

  /**
   * Remove all tracked points and subscribers. Call during dispose.
   */
  clear(): void {
    this.trackedPoints.clear();
    this.projectedPositions.clear();
    this.subscribers.clear();
    this.globalSubscribers.clear();
  }

  /**
   * Convert camera distance to a DOM scale factor.
   * Uses inverse-linear interpolation clamped between MIN_SCALE and MAX_SCALE.
   *
   * @private
   * @param {number} distance - Distance from camera to world point
   * @returns {number} Scale factor for DOM elements
   */
  private distanceToScale(distance: number): number {
    const t = Math.max(
      0,
      Math.min(
        1,
        (distance - MIN_LABEL_DISTANCE) /
          (MAX_LABEL_DISTANCE - MIN_LABEL_DISTANCE),
      ),
    );
    return MAX_SCALE - t * (MAX_SCALE - MIN_SCALE);
  }

  /**
   * Notify all subscribers of a point's updated position.
   *
   * @private
   * @param {string} id - Point identifier
   * @param {ProjectedPosition} pos - Updated projected position
   */
  private notifySubscribers(id: string, pos: ProjectedPosition): void {
    const subs = this.subscribers.get(id);
    if (!subs) return;
    const subArray = Array.from(subs);
    for (let i = 0; i < subArray.length; i++) {
      const callback = subArray[i];
      callback(pos);
    }
  }

  /**
   * Notify all global subscribers with the complete positions map.
   *
   * @private
   */
  private notifyGlobalSubscribers(): void {
    if (this.globalSubscribers.size === 0) return;
    const subArray = Array.from(this.globalSubscribers);
    for (let i = 0; i < subArray.length; i++) {
      subArray[i](this.projectedPositions);
    }
  }
}
