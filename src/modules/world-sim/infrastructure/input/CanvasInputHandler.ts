/**
 * @fileoverview Binds and raycasts pointer events on the World Sim canvas.
 * @description Translates `MouseEvent`s into `onBodyClick` and `onHoverChange`
 * callbacks.
 *
 * @module modules/world-sim/infrastructure/input/CanvasInputHandler
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { PerspectiveCamera } from 'three';
import type { RaycastService } from '@/modules/world-sim/application/services/RaycastService';

/**
 * Dependencies required to construct the handler.
 *
 * @interface CanvasInputHandlerDeps
 * @property {HTMLCanvasElement} canvas - The DOM canvas element to listen on
 * @property {PerspectiveCamera} camera - The active scene camera
 * @property {() => DOMRect} getCanvasRect - Current canvas bounding rect getter
 * @property {RaycastService} raycastService - Service used for body picking
 * @property {() => boolean} isTransitioning - Predicate gating handlers during camera transitions
 * @property {(bodyId: string) => void} onBodyClick - Fired when the user clicks a body (not the followed one)
 * @property {(bodyId: string | null) => void} onHoverChange - Fired when the hovered body changes
 */
export interface CanvasInputHandlerDeps {
  /** @property {HTMLCanvasElement} canvas - DOM canvas element */
  canvas: HTMLCanvasElement;
  /** @property {PerspectiveCamera} camera - Scene camera */
  camera: PerspectiveCamera;
  /** @property {() => DOMRect} getCanvasRect - Canvas rect getter */
  getCanvasRect: () => DOMRect;
  /** @property {RaycastService} raycastService - Picking service */
  raycastService: RaycastService;
  /** @property {() => boolean} isTransitioning - Camera transition predicate */
  isTransitioning: () => boolean;
  /** @property {(bodyId: string) => void} onBodyClick - Click callback */
  onBodyClick: (bodyId: string) => void;
  /** @property {(bodyId: string | null) => void} onHoverChange - Hover-change callback */
  onHoverChange: (bodyId: string | null) => void;
}

/**
 * Attaches and detaches pointer listeners on the canvas and holds bound handler
 * references for removal on dispose.
 *
 * @class CanvasInputHandler
 */
export class CanvasInputHandler {
  /** @property {CanvasInputHandlerDeps} deps - Injected dependencies */
  private deps: CanvasInputHandlerDeps;

  /** @property {string | null} hoveredBodyId - Tracks the currently hovered body */
  private hoveredBodyId: string | null = null;

  /** @property {(e: MouseEvent) => void} boundClick - Bound click handler */
  private boundClick: (e: MouseEvent) => void;

  /** @property {(e: MouseEvent) => void} boundMove - Bound mousemove handler */
  private boundMove: (e: MouseEvent) => void;

  /**
   * Create a new canvas input handler.
   *
   * @param {CanvasInputHandlerDeps} deps - Handler dependencies
   */
  constructor(deps: CanvasInputHandlerDeps) {
    this.deps = deps;
    this.boundClick = this.onClick.bind(this);
    this.boundMove = this.onMove.bind(this);
  }

  /**
   * Attach click and mousemove listeners to the canvas.
   */
  attach(): void {
    this.deps.canvas.addEventListener('click', this.boundClick);
    this.deps.canvas.addEventListener('mousemove', this.boundMove);
  }

  /**
   * Remove listeners from the canvas and reset hover state.
   */
  detach(): void {
    this.deps.canvas.removeEventListener('click', this.boundClick);
    this.deps.canvas.removeEventListener('mousemove', this.boundMove);
    this.hoveredBodyId = null;
  }

  /**
   * Raycast a click event into a body ID and fire the click callback.
   *
   * @private
   * @param {MouseEvent} event - The click event
   */
  private onClick(event: MouseEvent): void {
    if (this.deps.isTransitioning()) return;
    const bodyId = this.deps.raycastService.raycastBody(
      event,
      this.deps.camera,
      this.deps.getCanvasRect(),
    );
    if (bodyId) this.deps.onBodyClick(bodyId);
  }

  /**
   * Raycast a mousemove event and fire the hover-change callback when the
   * hovered body changes.
   *
   * @private
   * @param {MouseEvent} event - The mousemove event
   */
  private onMove(event: MouseEvent): void {
    if (this.deps.isTransitioning()) return;
    const bodyId = this.deps.raycastService.raycastBody(
      event,
      this.deps.camera,
      this.deps.getCanvasRect(),
    );
    if (bodyId !== this.hoveredBodyId) {
      this.hoveredBodyId = bodyId;
      this.deps.onHoverChange(bodyId);
    }
  }
}
