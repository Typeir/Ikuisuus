/**
 * @fileoverview Camera Controller — Facade Coordinating Orbit, Follow, and Commands
 * @description Slim facade composing CameraOrbitControls, CameraFollowSystem, and
 * CameraCommand execution. The orbit controls always work relative to the current
 * orbit center (target), and the follow system moves that center with a tracked body.
 * This means manual orbit + zoom work identically whether free-floating or locked
 * to a moving celestial body.
 *
 * @module worldSim/camera/CameraController
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { PerspectiveCamera, Spherical, Vector3 } from 'three';
import type { SceneEventBus } from '../bridge/SceneEventBus';
import type {
    ICameraCommand,
    ICameraController,
} from '../celestials/interfaces';
import { BOUND_RADIUS } from '../config/cameraTuning';
import { ResetViewCommand } from './CameraCommand';
import { CameraFollowSystem } from './CameraFollowSystem';
import { CameraOrbitControls } from './CameraOrbitControls';

/** @constant {Vector3} TEMP_PAN - Reusable vector for pan calculations */
const TEMP_PAN = new Vector3();

/**
 * Coordinates camera orbit controls, body-follow tracking, and animated
 * command transitions. Manual orbit and zoom always work relative to the
 * current orbit center, whether that center is static or tracking a body.
 *
 * @class CameraController
 * @implements {ICameraController}
 *
 * @example
 * ```ts
 * const controller = new CameraController(camera, canvas, eventBus);
 * controller.setFollowTarget(() => body.mesh.position.clone());
 * controller.executeCommand(new ZoomToBodyCommand(...));
 * // Each frame:
 * controller.update(deltaTime);
 * // Cleanup:
 * controller.dispose();
 * ```
 */
export class CameraController implements ICameraController {
  /** @property {PerspectiveCamera} camera - The camera being controlled */
  private camera: PerspectiveCamera;

  /** @property {SceneEventBus} eventBus - Event bus for transition events */
  private eventBus: SceneEventBus;

  /** @property {CameraOrbitControls} orbitControls - Input-driven orbit handler */
  private orbitControls: CameraOrbitControls;

  /** @property {CameraFollowSystem} followSystem - Body tracking system */
  private followSystem: CameraFollowSystem;

  /** @property {ICameraCommand | null} activeCommand - Currently executing command */
  private activeCommand: ICameraCommand | null = null;

  /** @property {Vector3} target - Orbit center (look-at point) */
  private target: Vector3 = new Vector3(0, 0, 0);

  /** @property {(() => void) | null} onPanUnlock - External callback fired when pan unlocks follow */
  public onPanUnlock: (() => void) | null = null;

  /**
   * Create a new CameraController.
   *
   * @param {PerspectiveCamera} camera - The camera to control
   * @param {HTMLCanvasElement} canvas - The canvas element for input binding
   * @param {SceneEventBus} eventBus - Event bus for emitting camera events
   */
  constructor(
    camera: PerspectiveCamera,
    canvas: HTMLCanvasElement,
    eventBus: SceneEventBus,
  ) {
    this.camera = camera;
    this.eventBus = eventBus;

    const initialOffset = new Vector3().subVectors(
      camera.position,
      this.target,
    );
    const initialSpherical = new Spherical().setFromVector3(initialOffset);

    this.orbitControls = new CameraOrbitControls(canvas, initialSpherical);
    this.followSystem = new CameraFollowSystem();

    this.orbitControls.onPan = () => {
      this.clearFollowTarget();
      if (this.onPanUnlock) {
        this.onPanUnlock();
      }
    };
  }

  /**
   * Execute a camera command, suspending manual controls during the transition.
   * The follow system continues to operate so the command can track moving bodies.
   *
   * @param {ICameraCommand} command - The command to execute
   */
  executeCommand(command: ICameraCommand): void {
    this.activeCommand = command;
    this.orbitControls.setEnabled(false);
    this.eventBus.emit('camera:transition:start', { command: command.type });
  }

  /**
   * Cancel any active camera command and re-enable manual controls.
   */
  cancelCommand(): void {
    if (this.activeCommand) {
      this.activeCommand = null;
      this.orbitControls.setEnabled(true);
      this.syncOrbitFromCamera();
    }
  }

  /**
   * Fully reset the camera to the initial system overview state.
   * Clears follow target, cancels any active command, resets the orbit center
   * to the origin, zeros all control state, and executes a smooth transition
   * back to the default position.
   */
  resetToDefault(): void {
    this.followSystem.clearTarget();
    this.activeCommand = null;
    this.target.set(0, 0, 0);
    this.orbitControls.resetState();
    this.executeCommand(new ResetViewCommand());
  }

  /**
   * Set the orbit target (look-at center point).
   *
   * @param {Vector3} newTarget - The new orbit center
   */
  setTarget(newTarget: Vector3): void {
    this.target.copy(newTarget);
    this.syncOrbitFromCamera();
  }

  /**
   * Set a dynamic follow target. Snaps the orbit center to the body's current
   * position so that when the transition command completes, the spherical offset
   * is correct relative to the body (not the old orbit center).
   *
   * @param {() => Vector3} positionGetter - Function returning the body's current world position
   */
  setFollowTarget(positionGetter: () => Vector3): void {
    this.target.copy(positionGetter());
    this.followSystem.setTarget(positionGetter);

    this.orbitControls.onPan = () => {
      this.clearFollowTarget();
      if (this.onPanUnlock) {
        this.onPanUnlock();
      }
    };
  }

  /**
   * Clear the follow target, freezing the orbit center at its current position.
   */
  clearFollowTarget(): void {
    this.followSystem.clearTarget();
  }

  /**
   * Main per-frame update. The follow delta only shifts the orbit center
   * (target), never the camera directly. The camera position is always
   * resolved in a single deterministic path — either by a command, by orbit
   * recomputation, or by an explicit reposition when following a moving body.
   * This eliminates double-write jitter when a body moves while the user
   * orbits the camera simultaneously.
   *
   * @param {number} deltaTime - Time since last frame in seconds
   */
  update(deltaTime: number): void {
    const followDelta = this.followSystem.computeDelta();
    const hasFollowDelta = followDelta.lengthSq() > 0;

    if (hasFollowDelta) {
      this.target.add(followDelta);

      if (this.activeCommand?.applyFollowDelta) {
        this.activeCommand.applyFollowDelta(followDelta);
      }
    }

    if (this.activeCommand) {
      if (hasFollowDelta) {
        this.camera.position.add(followDelta);
      }
      this.updateCommand(deltaTime);
      this.clampToBound(this.target);
      this.clampToBound(this.camera.position);
      return;
    }

    this.updateManualOrbit(hasFollowDelta);
  }

  /**
   * Whether a camera command transition is currently in progress.
   *
   * @returns {boolean} True if transitioning
   */
  isTransitioning(): boolean {
    return this.activeCommand !== null;
  }

  /**
   * Dispose of all resources and event listeners.
   */
  dispose(): void {
    this.orbitControls.dispose();
    this.followSystem.clearTarget();
    this.activeCommand = null;
  }

  /**
   * Advance the active camera command. Re-enables orbit controls
   * when the command completes.
   *
   * @private
   * @param {number} deltaTime - Frame delta time
   */
  private updateCommand(deltaTime: number): void {
    if (!this.activeCommand) return;

    const isComplete = this.activeCommand.execute(this.camera, deltaTime);
    if (isComplete) {
      const completedType = this.activeCommand.type;
      this.activeCommand = null;
      this.orbitControls.setEnabled(true);
      this.syncOrbitFromCamera();
      this.eventBus.emit('camera:transition:end', { command: completedType });
    }
  }

  /**
   * Apply orbit damping, pan, and recompute the camera position from
   * spherical coordinates + orbit center. When the followed body moved
   * this frame, the camera is always repositioned from the updated target
   * so both transforms are applied in a single write.
   *
   * @private
   * @param {boolean} hasFollowDelta - Whether the follow target moved this frame
   */
  private updateManualOrbit(hasFollowDelta: boolean): void {
    this.orbitControls.applyDamping();

    const pan = this.orbitControls.panDelta;
    if (pan.lengthSq() > 0) {
      TEMP_PAN.copy(pan).applyQuaternion(this.camera.quaternion);
      this.target.add(TEMP_PAN);
      this.orbitControls.panDelta.set(0, 0, 0);
      this.orbitControls.isDirty = true;
    }

    if (this.orbitControls.isDirty || hasFollowDelta) {
      this.applyCameraPosition();
      this.orbitControls.isDirty = false;
    } else if (this.followSystem.isFollowing()) {
      this.camera.lookAt(this.target);
    }
  }

  /**
   * Compute the camera position from spherical coords relative to the orbit target.
   *
   * @private
   */
  private applyCameraPosition(): void {
    const offset = this.orbitControls.getOffset();
    this.clampToBound(this.target);
    this.camera.position.copy(this.target).add(offset);
    this.clampToBound(this.camera.position);
    this.camera.lookAt(this.target);
  }

  /**
   * Project a world-space vector back inside the Everdark sphere centered at
   * the origin. Non-sticky: a clamped position is overwritten next frame from
   * `target + offset`, so any input that pulls inward (zoom in, drag the other
   * way, pan back toward origin) takes effect on the very next frame without
   * any accumulated lag.
   *
   * @private
   * @param {Vector3} vec - Vector to clamp in place
   */
  private clampToBound(vec: Vector3): void {
    const r2 = vec.lengthSq();
    if (r2 <= BOUND_RADIUS * BOUND_RADIUS) return;
    vec.multiplyScalar(BOUND_RADIUS / Math.sqrt(r2));
  }

  /**
   * Sync orbit controls' spherical state from the camera's current position.
   * Called after command completion or target changes.
   *
   * @private
   */
  private syncOrbitFromCamera(): void {
    const offset = new Vector3().subVectors(this.camera.position, this.target);
    this.orbitControls.syncFromOffset(offset);
  }
}
