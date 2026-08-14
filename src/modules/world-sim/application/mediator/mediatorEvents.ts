/**
 * @fileoverview Mediator Events Helpers
 * @description Creates and attaches a CanvasInputHandler with injected dependencies.
 *
 * @module modules/world-sim/application/mediator/mediatorEvents
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { RaycastService } from '@/modules/world-sim/application/services/RaycastService';
import { CanvasInputHandler } from '@/modules/world-sim/infrastructure/input/CanvasInputHandler';
import type { PerspectiveCamera } from 'three';

/**
 * Create a CanvasInputHandler with injected dependencies and attach it to the canvas.
 *
 * @param {HTMLCanvasElement} canvas - Canvas element to listen on
 * @param {PerspectiveCamera} camera - Active scene camera for raycasting
 * @param {() => DOMRect} getCanvasRect - Getter for canvas bounding rect
 * @param {RaycastService} raycastService - Service used for body picking
 * @param {() => boolean} isTransitioning - Predicate gating handlers during camera transitions
 * @param {(bodyId: string) => void} onBodyClick - Called when a body is clicked
 * @param {(bodyId: string | null) => void} onHoverChange - Called when hover target changes
 * @returns {CanvasInputHandler} The attached input handler
 */
export function createInputHandler(
  canvas: HTMLCanvasElement,
  camera: PerspectiveCamera,
  getCanvasRect: () => DOMRect,
  raycastService: RaycastService,
  isTransitioning: () => boolean,
  onBodyClick: (bodyId: string) => void,
  onHoverChange: (bodyId: string | null) => void,
): CanvasInputHandler {
  const handler = new CanvasInputHandler({
    canvas,
    camera,
    getCanvasRect,
    raycastService,
    isTransitioning,
    onBodyClick,
    onHoverChange,
  });
  handler.attach();
  return handler;
}
