/**
 * @fileoverview Follows a moving body as the camera orbit center.
 * @description Tracks a follow target so the orbit center moves with the body each frame.
 *
 * @module modules/world-sim/infrastructure/input/CameraFollowSystem
 * @version 2.0.0
 * @author Typeir
 * @since 2.0.0
 */

import { Vector3 } from 'three';

/**
 * Tracks a moving celestial body as the camera's orbit center.
 * Returns the body's movement delta per frame.
 *
 * @class CameraFollowSystem
 */
export class CameraFollowSystem {
  /** @property {(() => Vector3) | null} positionGetter - Function returning the current world position of the followed body */
  private positionGetter: (() => Vector3) | null = null;

  /** @property {Vector3} lastPosition - Cached position from the previous frame */
  private lastPosition: Vector3 = new Vector3();

  /** @property {boolean} hasTarget - Whether a follow target is active */
  private hasTarget: boolean = false;

  /** @property {Vector3} tempDelta - Reusable vector for frame delta computation */
  private tempDelta: Vector3 = new Vector3();

  /**
   * Set the follow target. The camera orbit center will track this body.
   *
   * @param {() => Vector3} getter - Function returning the body's current world position
   */
  setTarget(getter: () => Vector3): void {
    this.positionGetter = getter;
    this.lastPosition.copy(getter());
    this.hasTarget = true;
  }

  /**
   * Clear the follow target. The orbit center stays where it was.
   */
  clearTarget(): void {
    this.positionGetter = null;
    this.hasTarget = false;
  }

  /**
   * Check whether a follow target is currently active.
   *
   * @returns {boolean} True if following a body
   */
  isFollowing(): boolean {
    return this.hasTarget;
  }

  /**
   * Get the current target position. Returns null if not following.
   *
   * @returns {Vector3 | null} Current world position of the followed body
   */
  getTargetPosition(): Vector3 | null {
    if (!this.positionGetter) return null;
    return this.positionGetter();
  }

  /**
   * Compute the frame delta — how much the followed body moved since last frame.
   * Updates the internal cached position. Returns zero vector if not following.
   *
   * @returns {Vector3} Movement delta of the followed body
   */
  computeDelta(): Vector3 {
    if (!this.positionGetter || !this.hasTarget) {
      return this.tempDelta.set(0, 0, 0);
    }

    const currentPos = this.positionGetter();
    this.tempDelta.subVectors(currentPos, this.lastPosition);
    this.lastPosition.copy(currentPos);
    return this.tempDelta;
  }
}
