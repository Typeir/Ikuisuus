/**
 * @fileoverview Camera Orbit Controls — Input-Driven Spherical Orbit
 * @description Pure input handler for mouse drag, scroll zoom, and touch gestures.
 * Maintains spherical coordinates relative to an externally managed orbit center.
 * Does NOT own the target or camera — the CameraController reads from this
 * and applies positions.
 *
 * @module worldSim/camera/CameraOrbitControls
 * @version 2.0.0
 * @author Typeir
 * @since 2.0.0
 */

import { Spherical, Vector3 } from 'three';
import {
    DAMPING_FACTOR,
    MAX_DISTANCE,
    MAX_POLAR_ANGLE,
    MIN_DISTANCE,
    MIN_POLAR_ANGLE,
    ORBIT_SENSITIVITY,
    PAN_SCALE_FACTOR,
    VELOCITY_THRESHOLD,
    ZOOM_SENSITIVITY,
} from '../config/cameraTuning';

/**
 * Manages user input for orbiting a camera around a center point.
 * Owns the spherical coordinate state and angular velocity damping.
 * The controller reads the spherical state and applies it to the camera.
 *
 * @class CameraOrbitControls
 */
export class CameraOrbitControls {
  /** @property {Spherical} spherical - Spherical coordinates for orbit */
  public spherical: Spherical;

  /** @property {boolean} isDirty - Whether the spherical coords changed since last read */
  public isDirty: boolean = false;

  /** @property {boolean} isDragging - Whether the user is currently dragging */
  private isDragging: boolean = false;

  /** @property {boolean} isPanning - Whether the user is currently panning with middle mouse */
  private isPanning: boolean = false;

  /** @property {boolean} isEnabled - Whether input is accepted */
  private isEnabled: boolean = true;

  /** @property {{ x: number; y: number }} lastMouse - Last pointer position */
  private lastMouse: { x: number; y: number } = { x: 0, y: 0 };

  /** @property {{ theta: number; phi: number }} angularVelocity - Current angular velocity */
  private angularVelocity: { theta: number; phi: number } = {
    theta: 0,
    phi: 0,
  };

  /** @property {HTMLCanvasElement} canvas - Input source element */
  private canvas: HTMLCanvasElement;

  /** @property {Vector3} panDelta - Accumulated pan offset for current frame */
  public panDelta: Vector3 = new Vector3();

  /** @property {(() => void) | null} onPan - Callback fired when user pans, used to unlock follow */
  public onPan: (() => void) | null = null;

  /** @property {(e: MouseEvent) => void} boundOnMouseDown - Bound handler */
  private boundOnMouseDown: (e: MouseEvent) => void;

  /** @property {(e: MouseEvent) => void} boundOnMouseMove - Bound handler */
  private boundOnMouseMove: (e: MouseEvent) => void;

  /** @property {(e: MouseEvent) => void} boundOnMouseUp - Bound handler */
  private boundOnMouseUp: (e: MouseEvent) => void;

  /** @property {(e: WheelEvent) => void} boundOnWheel - Bound handler */
  private boundOnWheel: (e: WheelEvent) => void;

  /** @property {(e: TouchEvent) => void} boundOnTouchStart - Bound handler */
  private boundOnTouchStart: (e: TouchEvent) => void;

  /** @property {(e: TouchEvent) => void} boundOnTouchMove - Bound handler */
  private boundOnTouchMove: (e: TouchEvent) => void;

  /** @property {() => void} boundOnTouchEnd - Bound handler */
  private boundOnTouchEnd: () => void;

  /** @property {(e: MouseEvent) => void} boundOnContextMenu - Bound handler to suppress context menu */
  private boundOnContextMenu: (e: MouseEvent) => void;

  /** @property {Vector3} tempOffset - Reusable vector for getOffset computation */
  private tempOffset: Vector3 = new Vector3();

  /**
   * Create orbit controls attached to a canvas element.
   *
   * @param {HTMLCanvasElement} canvas - The canvas element for input binding
   * @param {Spherical} [initialSpherical] - Optional initial spherical coordinates
   */
  constructor(canvas: HTMLCanvasElement, initialSpherical?: Spherical) {
    this.canvas = canvas;
    this.spherical = initialSpherical ?? new Spherical(400, Math.PI / 3, 0);

    this.boundOnMouseDown = this.onMouseDown.bind(this);
    this.boundOnMouseMove = this.onMouseMove.bind(this);
    this.boundOnMouseUp = this.onMouseUp.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnTouchStart = this.onTouchStart.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnTouchEnd = this.onTouchEnd.bind(this);
    this.boundOnContextMenu = (e: MouseEvent) => e.preventDefault();

    this.attachListeners();
  }

  /**
   * Enable or disable manual input handling.
   *
   * @param {boolean} enabled - Whether controls accept input
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.isDragging = false;
      this.isPanning = false;
      this.angularVelocity.theta = 0;
      this.angularVelocity.phi = 0;
    }
  }

  /**
   * Reset all transient state — angular velocity, pan delta, drag/pan flags.
   * Called during a full camera reset to ensure a clean slate.
   */
  resetState(): void {
    this.isDragging = false;
    this.isPanning = false;
    this.angularVelocity.theta = 0;
    this.angularVelocity.phi = 0;
    this.panDelta.set(0, 0, 0);
    this.isDirty = false;
  }

  /**
   * Apply damping to angular velocity each frame when not dragging.
   * Sets isDirty if the spherical coords change.
   */
  applyDamping(): void {
    if (this.isDragging) return;

    if (
      Math.abs(this.angularVelocity.theta) < VELOCITY_THRESHOLD &&
      Math.abs(this.angularVelocity.phi) < VELOCITY_THRESHOLD
    ) {
      return;
    }

    this.angularVelocity.theta *= DAMPING_FACTOR;
    this.angularVelocity.phi *= DAMPING_FACTOR;

    this.spherical.theta += this.angularVelocity.theta;
    this.spherical.phi += this.angularVelocity.phi;
    this.clampPhi();
    this.isDirty = true;
  }

  /**
   * Synchronize the spherical coordinates from an external camera offset.
   *
   * @param {Vector3} offset - Vector from target to camera position
   */
  syncFromOffset(offset: Vector3): void {
    this.spherical.setFromVector3(offset);
  }

  /**
   * Get the camera offset vector from the current spherical coordinates.
   *
   * @returns {Vector3} Offset from target to camera position
   */
  getOffset(): Vector3 {
    return this.tempOffset.setFromSpherical(this.spherical);
  }

  /**
   * Remove all event listeners and clean up.
   */
  dispose(): void {
    this.canvas.removeEventListener('mousedown', this.boundOnMouseDown);
    window.removeEventListener('mousemove', this.boundOnMouseMove);
    window.removeEventListener('mouseup', this.boundOnMouseUp);
    this.canvas.removeEventListener('wheel', this.boundOnWheel);
    this.canvas.removeEventListener('contextmenu', this.boundOnContextMenu);
    this.canvas.removeEventListener('touchstart', this.boundOnTouchStart);
    window.removeEventListener('touchmove', this.boundOnTouchMove);
    window.removeEventListener('touchend', this.boundOnTouchEnd);
  }

  /**
   * Attach all event listeners.
   *
   * @private
   */
  private attachListeners(): void {
    this.canvas.addEventListener('mousedown', this.boundOnMouseDown);
    window.addEventListener('mousemove', this.boundOnMouseMove);
    window.addEventListener('mouseup', this.boundOnMouseUp);
    this.canvas.addEventListener('wheel', this.boundOnWheel, {
      passive: false,
    });
    this.canvas.addEventListener('contextmenu', this.boundOnContextMenu);
    this.canvas.addEventListener('touchstart', this.boundOnTouchStart, {
      passive: false,
    });
    window.addEventListener('touchmove', this.boundOnTouchMove, {
      passive: false,
    });
    window.addEventListener('touchend', this.boundOnTouchEnd);
  }

  /**
   * Clamp the phi angle to prevent gimbal lock.
   *
   * @private
   */
  private clampPhi(): void {
    this.spherical.phi = Math.max(
      MIN_POLAR_ANGLE,
      Math.min(MAX_POLAR_ANGLE, this.spherical.phi),
    );
  }

  /**
   * @private
   * @param {MouseEvent} e - Mouse event
   */
  private onMouseDown(e: MouseEvent): void {
    if (!this.isEnabled) return;

    if (e.button === 0) {
      this.isDragging = true;
      this.lastMouse = { x: e.clientX, y: e.clientY };
      this.angularVelocity.theta = 0;
      this.angularVelocity.phi = 0;
    } else if (e.button === 1) {
      e.preventDefault();
      this.isPanning = true;
      this.lastMouse = { x: e.clientX, y: e.clientY };
    }
  }

  /**
   * @private
   * @param {MouseEvent} e - Mouse event
   */
  private onMouseMove(e: MouseEvent): void {
    if (!this.isEnabled) return;

    const deltaX = e.clientX - this.lastMouse.x;
    const deltaY = e.clientY - this.lastMouse.y;

    if (this.isPanning) {
      const panScale = this.spherical.radius * PAN_SCALE_FACTOR;
      this.panDelta.set(-deltaX * panScale, deltaY * panScale, 0);
      this.isDirty = true;
      this.lastMouse = { x: e.clientX, y: e.clientY };

      if (this.onPan) {
        this.onPan();
        this.onPan = null;
      }
      return;
    }

    if (!this.isDragging) return;

    this.angularVelocity.theta = -deltaX * ORBIT_SENSITIVITY;
    this.angularVelocity.phi = -deltaY * ORBIT_SENSITIVITY;

    this.spherical.theta += this.angularVelocity.theta;
    this.spherical.phi += this.angularVelocity.phi;
    this.clampPhi();
    this.isDirty = true;

    this.lastMouse = { x: e.clientX, y: e.clientY };
  }

  /** @private */
  private onMouseUp(e: MouseEvent): void {
    if (e.button === 0) {
      this.isDragging = false;
    } else if (e.button === 1) {
      this.isPanning = false;
    }
  }

  /**
   * @private
   * @param {WheelEvent} e - Wheel event
   */
  private onWheel(e: WheelEvent): void {
    if (!this.isEnabled) return;
    e.preventDefault();

    const zoomDelta =
      e.deltaY > 0 ? 1 + ZOOM_SENSITIVITY : 1 - ZOOM_SENSITIVITY;
    this.spherical.radius = Math.max(
      MIN_DISTANCE,
      Math.min(MAX_DISTANCE, this.spherical.radius * zoomDelta),
    );
    this.isDirty = true;
  }

  /**
   * @private
   * @param {TouchEvent} e - Touch event
   */
  private onTouchStart(e: TouchEvent): void {
    if (!this.isEnabled || e.touches.length !== 1) return;
    e.preventDefault();
    this.isDragging = true;
    this.lastMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    this.angularVelocity.theta = 0;
    this.angularVelocity.phi = 0;
  }

  /**
   * @private
   * @param {TouchEvent} e - Touch event
   */
  private onTouchMove(e: TouchEvent): void {
    if (!this.isDragging || !this.isEnabled || e.touches.length !== 1) return;
    e.preventDefault();

    const touch = e.touches[0];
    const deltaX = touch.clientX - this.lastMouse.x;
    const deltaY = touch.clientY - this.lastMouse.y;

    this.angularVelocity.theta = -deltaX * ORBIT_SENSITIVITY;
    this.angularVelocity.phi = -deltaY * ORBIT_SENSITIVITY;

    this.spherical.theta += this.angularVelocity.theta;
    this.spherical.phi += this.angularVelocity.phi;
    this.clampPhi();
    this.isDirty = true;

    this.lastMouse = { x: touch.clientX, y: touch.clientY };
  }

  /** @private */
  private onTouchEnd(): void {
    this.isDragging = false;
  }
}
