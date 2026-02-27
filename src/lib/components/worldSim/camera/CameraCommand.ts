/**
 * @fileoverview Camera Commands — Encapsulated Camera Transitions
 * @description Implements the Command pattern for camera movements. Each command
 * encapsulates a specific camera transition (zoom to body, zoom to region, reset).
 * Commands are executed by the CameraController and can be queued or cancelled.
 *
 * Body tracking during transitions is handled by the CameraFollowSystem, so
 * commands only need to lerp toward relative offsets from the (moving) target.
 *
 * @module worldSim/camera/CameraCommand
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { PerspectiveCamera, Vector3 } from 'three';
import type { ICameraCommand } from '../celestials/interfaces';

/** @constant {number} EASE_FACTOR - Smoothing factor for lerp transitions (0-1) */
const EASE_FACTOR = 0.08;

/** @constant {number} COMPLETION_THRESHOLD - Distance threshold to consider transition complete */
const COMPLETION_THRESHOLD = 0.5;

/**
 * Camera transition state shared by all commands during execution.
 *
 * @interface CameraTransitionState
 * @property {Vector3} targetPosition - Target camera position
 * @property {Vector3} targetLookAt - Target look-at point
 * @property {Vector3} currentLookAt - Current interpolated look-at point
 * @property {boolean} initialized - Whether the state has been initialized
 */
interface CameraTransitionState {
  /** @property {Vector3} targetPosition - Destination for the camera position */
  targetPosition: Vector3;
  /** @property {Vector3} targetLookAt - Destination for the look-at point */
  targetLookAt: Vector3;
  /** @property {Vector3} currentLookAt - Interpolating look-at during transition */
  currentLookAt: Vector3;
  /** @property {boolean} initialized - Whether the state has been initialized */
  initialized: boolean;
}

/**
 * Smoothly transitions the camera to a position relative to a celestial body.
 * The CameraFollowSystem handles body tracking — this command just lerps toward
 * the body's position at the time of initialization (which moves with the body
 * because the follow system shifts everything).
 *
 * @class ZoomToBodyCommand
 * @implements {ICameraCommand}
 *
 * @example
 * ```ts
 * const cmd = new ZoomToBodyCommand(
 *   new Vector3(100, 0, 0),
 *   20,
 *   'damocles'
 * );
 * controller.executeCommand(cmd);
 * ```
 */
export class ZoomToBodyCommand implements ICameraCommand {
  /** @property {string} type - Command identifier */
  public readonly type = 'zoom-to-body';

  /** @property {CameraTransitionState} state - Internal transition state */
  private state: CameraTransitionState;

  /** @property {Vector3} bodyPosition - World position of the target body */
  private bodyPosition: Vector3;

  /** @property {number} viewDistance - Distance from the body to orbit at */
  private viewDistance: number;

  /** @property {string} bodyId - Identifier of the target celestial body */
  public readonly bodyId: string;

  /**
   * @param {Vector3} bodyPosition - World position of the target body
   * @param {number} viewDistance - Desired distance from the body surface
   * @param {string} bodyId - Identifier of the celestial body being targeted
   */
  constructor(bodyPosition: Vector3, viewDistance: number, bodyId: string) {
    this.bodyPosition = bodyPosition.clone();
    this.viewDistance = viewDistance;
    this.bodyId = bodyId;
    this.state = {
      targetPosition: new Vector3(),
      targetLookAt: bodyPosition.clone(),
      currentLookAt: new Vector3(),
      initialized: false,
    };
  }

  /**
   * Advance the camera transition by one frame.
   *
   * @param {PerspectiveCamera} camera - The camera to move
   * @param {number} _deltaTime - Time since last frame (unused, using lerp factor)
   * @returns {boolean} True when the transition is complete
   */
  execute(camera: PerspectiveCamera, _deltaTime: number): boolean {
    if (!this.state.initialized) {
      this.initializeTransition(camera);
    }

    camera.position.lerp(this.state.targetPosition, EASE_FACTOR);
    this.state.currentLookAt.lerp(this.state.targetLookAt, EASE_FACTOR);
    camera.lookAt(this.state.currentLookAt);

    const distance = camera.position.distanceTo(this.state.targetPosition);
    return distance < COMPLETION_THRESHOLD;
  }

  /**
   * Apply the follow system's frame delta to the command's target positions,
   * keeping the command in sync with the moving body.
   *
   * @param {Vector3} delta - Frame-to-frame movement of the followed body
   */
  applyFollowDelta(delta: Vector3): void {
    if (!this.state.initialized) return;
    this.bodyPosition.add(delta);
    this.state.targetPosition.add(delta);
    this.state.targetLookAt.add(delta);
  }

  /**
   * Set up the target position based on the camera's current angle to the body.
   *
   * @private
   * @param {PerspectiveCamera} camera - Current camera
   */
  private initializeTransition(camera: PerspectiveCamera): void {
    const direction = new Vector3()
      .subVectors(camera.position, this.bodyPosition)
      .normalize();

    this.state.targetPosition.copy(
      this.bodyPosition
        .clone()
        .add(direction.multiplyScalar(this.viewDistance)),
    );
    this.state.currentLookAt.copy(camera.position);
    this.state.initialized = true;
  }
}

/**
 * Smoothly transitions the camera to focus on a specific surface region.
 * Used when a user clicks a landmass marker on a celestial body.
 *
 * @class ZoomToRegionCommand
 * @implements {ICameraCommand}
 */
export class ZoomToRegionCommand implements ICameraCommand {
  /** @property {string} type - Command identifier */
  public readonly type = 'zoom-to-region';

  /** @property {CameraTransitionState} state - Internal transition state */
  private state: CameraTransitionState;

  /** @property {Vector3} regionWorldPosition - Region position in world space */
  private regionWorldPosition: Vector3;

  /** @property {number} viewDistance - Distance from the region surface */
  private viewDistance: number;

  /** @property {string} regionId - Identifier of the target region */
  public readonly regionId: string;

  /**
   * @param {Vector3} regionWorldPosition - World-space position of the region
   * @param {number} viewDistance - Desired distance from the region
   * @param {string} regionId - Identifier of the region being targeted
   */
  constructor(
    regionWorldPosition: Vector3,
    viewDistance: number,
    regionId: string,
  ) {
    this.regionWorldPosition = regionWorldPosition.clone();
    this.viewDistance = viewDistance;
    this.regionId = regionId;
    this.state = {
      targetPosition: new Vector3(),
      targetLookAt: regionWorldPosition.clone(),
      currentLookAt: new Vector3(),
      initialized: false,
    };
  }

  /**
   * Advance the camera transition by one frame.
   *
   * @param {PerspectiveCamera} camera - The camera to move
   * @param {number} _deltaTime - Time since last frame
   * @returns {boolean} True when the transition is complete
   */
  execute(camera: PerspectiveCamera, _deltaTime: number): boolean {
    if (!this.state.initialized) {
      this.initializeTransition();
    }

    camera.position.lerp(this.state.targetPosition, EASE_FACTOR);
    this.state.currentLookAt.lerp(this.state.targetLookAt, EASE_FACTOR);
    camera.lookAt(this.state.currentLookAt);

    const distance = camera.position.distanceTo(this.state.targetPosition);
    return distance < COMPLETION_THRESHOLD;
  }

  /**
   * Apply the follow system's frame delta to the command's target positions.
   *
   * @param {Vector3} delta - Frame-to-frame movement of the followed body
   */
  applyFollowDelta(delta: Vector3): void {
    if (!this.state.initialized) return;
    this.regionWorldPosition.add(delta);
    this.state.targetPosition.add(delta);
    this.state.targetLookAt.add(delta);
  }

  /**
   * Set up the target position outward from the region's surface normal.
   *
   * @private
   */
  private initializeTransition(): void {
    const surfaceNormal = this.regionWorldPosition.clone().normalize();

    this.state.targetPosition.copy(
      this.regionWorldPosition
        .clone()
        .add(surfaceNormal.multiplyScalar(this.viewDistance)),
    );
    this.state.currentLookAt.copy(this.regionWorldPosition);
    this.state.initialized = true;
  }
}

/**
 * Animated return to the default system overview position.
 *
 * @class ResetViewCommand
 * @implements {ICameraCommand}
 */
export class ResetViewCommand implements ICameraCommand {
  /** @property {string} type - Command identifier */
  public readonly type = 'reset-view';

  /** @property {Vector3} defaultPosition - Default camera position */
  private defaultPosition: Vector3;

  /** @property {Vector3} defaultLookAt - Default look-at target */
  private defaultLookAt: Vector3;

  /** @property {Vector3} currentLookAt - Interpolating look-at point */
  private currentLookAt: Vector3;

  /** @property {boolean} initialized - Whether the interpolation started */
  private initialized: boolean = false;

  /**
   * @param {Vector3} [defaultPosition] - Override for default camera position
   * @param {Vector3} [defaultLookAt] - Override for default look-at target
   */
  constructor(defaultPosition?: Vector3, defaultLookAt?: Vector3) {
    this.defaultPosition = defaultPosition ?? new Vector3(0, 800, 2500);
    this.defaultLookAt = defaultLookAt ?? new Vector3(0, 0, 0);
    this.currentLookAt = new Vector3();
  }

  /**
   * Advance the camera transition by one frame.
   *
   * @param {PerspectiveCamera} camera - The camera to move
   * @param {number} _deltaTime - Time since last frame
   * @returns {boolean} True when the transition is complete
   */
  execute(camera: PerspectiveCamera, _deltaTime: number): boolean {
    if (!this.initialized) {
      this.currentLookAt.copy(camera.position);
      this.initialized = true;
    }

    camera.position.lerp(this.defaultPosition, EASE_FACTOR);
    this.currentLookAt.lerp(this.defaultLookAt, EASE_FACTOR);
    camera.lookAt(this.currentLookAt);

    const distance = camera.position.distanceTo(this.defaultPosition);
    return distance < COMPLETION_THRESHOLD;
  }

  /**
   * No-op for reset commands (follow target is cleared before reset).
   *
   * @param {Vector3} _delta - Unused movement delta
   */
  applyFollowDelta(_delta: Vector3): void {
    /* no-op — reset always targets a fixed world position */
  }
}
