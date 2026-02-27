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

    /* Re-arm the pan-unlock callback for this follow session */
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
   * Main per-frame update. Handles three phases in order:
   * 1. Follow system — move orbit center with the tracked body
   * 2. Command execution — advance any active animated transition
   * 3. Manual orbit — apply damping and user input
   *
   * @param {number} deltaTime - Time since last frame in seconds
   */
  update(deltaTime: number): void {
    this.updateFollowTarget();

    if (this.activeCommand) {
      this.updateCommand(deltaTime);
      return;
    }

    this.updateManualOrbit();
    this.emitCameraPosition();
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
   * Phase 1: Move the orbit center (and camera) by the body's frame-to-frame delta.
   * This runs every frame regardless of command/manual state so the camera
   * tracks the body during transitions too.
   *
   * @private
   */
  private updateFollowTarget(): void {
    const delta = this.followSystem.computeDelta();
    if (delta.lengthSq() === 0) return;

    this.target.add(delta);
    this.camera.position.add(delta);

    if (this.activeCommand?.applyFollowDelta) {
      this.activeCommand.applyFollowDelta(delta);
    }
  }

  /**
   * Phase 2: Advance the active camera command. Re-enables orbit controls
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

    this.emitCameraPosition();
  }

  /**
   * Phase 3: Apply orbit damping and recompute camera position from
   * spherical coordinates + orbit center.
   *
   * @private
   */
  private updateManualOrbit(): void {
    this.orbitControls.applyDamping();

    /* Apply middle-click pan delta in camera-local space */
    const pan = this.orbitControls.panDelta;
    if (pan.lengthSq() > 0) {
      TEMP_PAN.copy(pan).applyQuaternion(this.camera.quaternion);
      this.target.add(TEMP_PAN);
      this.camera.position.add(TEMP_PAN);
      this.orbitControls.panDelta.set(0, 0, 0);
      this.orbitControls.isDirty = true;
    }

    if (this.orbitControls.isDirty) {
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
    this.camera.position.copy(this.target).add(offset);
    this.camera.lookAt(this.target);
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

  /**
   * Emit the camera:moved event with current position.
   *
   * @private
   */
  private emitCameraPosition(): void {
    this.eventBus.emit('camera:moved', {
      position: this.camera.position.clone(),
    });
  }
}
