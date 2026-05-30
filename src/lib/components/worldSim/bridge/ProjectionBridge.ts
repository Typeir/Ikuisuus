/**
 * @fileoverview Projection Bridge — 3D to 2D Adapter with Direct DOM Manipulation
 * @description Projects tracked 3D world positions to 2D screen coordinates each frame.
 * Supports two modes: (1) direct DOM element binding where the bridge applies CSS
 * transforms itself, and (2) a subscriber pattern for custom position handling.
 * Direct binding eliminates the subscriber indirection for the common label case.
 *
 * @module worldSim/bridge/ProjectionBridge
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { PerspectiveCamera, Vector3 } from 'three';

import type { ProjectedPosition } from '../celestials/interfaces';
import {
    MAX_LABEL_DISTANCE,
    MAX_LABEL_SCALE,
    MIN_LABEL_DISTANCE,
    MIN_LABEL_SCALE,
} from '../config/sceneTuning';

/**
 * Callback type for all-positions update subscribers.
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
 * bridge.subscribe((positions) => {
 *   positions.forEach((pos, id) => { ... });
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

  /** @property {Set} globalSubscribers - Callbacks receiving all positions each frame */
  private globalSubscribers: Set<GlobalPositionSubscriber> = new Set();

  /** @property {Map} boundElements - DOM elements directly managed by the bridge */
  private boundElements: Map<string, HTMLElement> = new Map();

  /** @property {Vector3} tempVec - Reusable vector to avoid allocations in hot loop */
  private tempVec: Vector3 = new Vector3();

  /** @property {Set<string>} occludedIds - Set of body IDs currently occluded by another body */
  private occludedIds: Set<string> = new Set();

  /**
   * Set the IDs of bodies currently occluded by other scene objects.
   * Called by the mediator each frame before update().
   *
   * @param {Set<string>} ids - Set of occluded body IDs
   */
  setOccluded(ids: Set<string>): void {
    this.occludedIds = ids;
  }

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
   * Stop tracking a point.
   *
   * @param {string} id - Identifier of the point to untrack
   */
  untrack(id: string): void {
    this.trackedPoints.delete(id);
    this.projectedPositions.delete(id);
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
   * Bind a DOM element to a tracked point. The bridge will directly apply
   * CSS transforms (position, visibility, scale) each frame — no subscriber needed.
   *
   * @param {string} id - Identifier matching a tracked point
   * @param {HTMLElement} element - DOM element to position
   */
  bindElement(id: string, element: HTMLElement): void {
    this.boundElements.set(id, element);
  }

  /**
   * Unbind a DOM element from a tracked point.
   *
   * @param {string} id - Identifier of the tracked point
   */
  unbindElement(id: string): void {
    this.boundElements.delete(id);
  }

  /**
   * Subscribe to all projected position updates each frame.
   *
   * @param {GlobalPositionSubscriber} callback - Called each frame with all projected positions
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback: GlobalPositionSubscriber): () => void {
    this.globalSubscribers.add(callback);
    return () => {
      this.globalSubscribers.delete(callback);
    };
  }

  /**
   * Project all tracked points, apply transforms to bound DOM elements,
   * and notify subscribers. Called once per frame from the animation loop — hot path.
   *
   * Bound elements get CSS transforms applied directly, bypassing the subscriber
   * layer entirely. Subscribers still receive the full positions map for custom handling.
   *
   * @param {PerspectiveCamera} camera - The scene camera
   * @param {DOMRect} canvasRect - Bounding rect of the Three.js canvas element
   */
  update(camera: PerspectiveCamera, canvasRect: DOMRect): void {
    this.trackedPoints.forEach((worldPos, id) => {
      this.tempVec.copy(worldPos).project(camera);

      const x = (this.tempVec.x * 0.5 + 0.5) * canvasRect.width;
      const y = (-this.tempVec.y * 0.5 + 0.5) * canvasRect.height;
      const visible = this.tempVec.z > 0 && this.tempVec.z < 1;
      const occluded = this.occludedIds.has(id);
      const distance = camera.position.distanceTo(worldPos);
      const scale = this.distanceToScale(distance);

      const pos: ProjectedPosition = {
        x,
        y,
        visible,
        occluded,
        distance,
        scale,
      };
      this.projectedPositions.set(id, pos);

      const el = this.boundElements.get(id);
      if (el) {
        if (!visible || occluded) {
          el.style.visibility = 'hidden';
        } else {
          el.style.visibility = 'visible';
          el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%) scale(${scale})`;
        }
      }
    });

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
    this.globalSubscribers.clear();
    this.boundElements.clear();
  }

  /**
   * Convert camera distance to a DOM scale factor.
   * Uses inverse-linear interpolation clamped between MIN_LABEL_SCALE and MAX_LABEL_SCALE.
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
    return MAX_LABEL_SCALE - t * (MAX_LABEL_SCALE - MIN_LABEL_SCALE);
  }

  /**
   * Notify all global subscribers with the complete positions map.
   *
   * @private
   */
  private notifyGlobalSubscribers(): void {
    if (this.globalSubscribers.size === 0) return;
    this.globalSubscribers.forEach((subscriber) => {
      subscriber(this.projectedPositions);
    });
  }
}
