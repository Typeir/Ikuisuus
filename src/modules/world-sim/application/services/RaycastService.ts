/**
 * @fileoverview Raycast Service — Interaction & Occlusion Raycasting
 * @description Encapsulates all Three.js raycasting logic for the World Sim.
 * Handles two concerns: mouse-based body picking (click/hover) and camera-based
 * occlusion detection (which bodies are hidden behind others).
 *
 * Owns the Raycaster instance, cached mesh arrays, and reusable math objects
 * to avoid per-frame allocations.
 *
 * @module worldSim/RaycastService
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
    Material,
    Mesh,
    Object3D,
    PerspectiveCamera,
    Raycaster,
    Vector2,
    Vector3,
} from 'three';
import { OCCLUSION_OPACITY_THRESHOLD } from '@/modules/world-sim/infrastructure/config/sceneTuning';

/**
 * Service responsible for all raycasting operations in the World Sim.
 * Manages cached mesh lists, mouse-based body picking, and camera-based
 * occlusion detection.
 *
 * @class RaycastService
 *
 * @example
 * ```ts
 * const raycastService = new RaycastService();
 * raycastService.buildMeshCaches(celestialMeshes);
 * const hitId = raycastService.raycastBody(event, camera, canvasRect);
 * const occluded = raycastService.computeOcclusion(camera, celestialEntries);
 * ```
 */
export class RaycastService {
  /** @property {Raycaster} raycaster - Shared raycaster instance */
  private raycaster: Raycaster = new Raycaster();

  /** @property {Vector2} mouseNDC - Normalized device coordinates for mouse picking */
  private mouseNDC: Vector2 = new Vector2();

  /** @property {Vector3} tempDir - Reusable direction vector for occlusion raycasting */
  private tempDir: Vector3 = new Vector3();

  /** @property {Object3D[]} interactionMeshes - Cached flat list of meshes for mouse picking */
  private interactionMeshes: Object3D[] = [];

  /** @property {Object3D[]} occlusionMeshes - Cached flat list of opaque meshes for occlusion testing */
  private occlusionMeshes: Object3D[] = [];

  /**
   * Build cached mesh arrays from celestial root meshes.
   * Traverses each root to collect individual meshes for raycasting.
   * Opaque (or near-opaque) meshes are used for occlusion testing.
   *
   * @param {Iterable<Object3D>} rootMeshes - Root Object3D nodes for all celestial bodies
   */
  buildMeshCaches(rootMeshes: Iterable<Object3D>): void {
    this.interactionMeshes = [];
    this.occlusionMeshes = [];

    const meshes = Array.from(rootMeshes);
    meshes.forEach((root) => {
      root.traverse((child: Object3D) => {
        if (!('isMesh' in child)) return;
        this.interactionMeshes.push(child);

        const mat = (child as Mesh).material;
        const primary: Material = Array.isArray(mat) ? mat[0] : mat;
        if (
          primary &&
          (!primary.transparent ||
            primary.opacity >= OCCLUSION_OPACITY_THRESHOLD)
        ) {
          this.occlusionMeshes.push(child);
        }
      });
    });
  }

  /**
   * Perform a raycast from a mouse event and return the ID of the hit body.
   * Walks up the scene graph from the hit mesh to find the parent with a bodyId.
   *
   * @param {MouseEvent} event - The mouse event with client coordinates
   * @param {PerspectiveCamera} camera - The scene camera
   * @param {DOMRect} canvasRect - The canvas bounding rect
   * @returns {string | null} The body ID if hit, null otherwise
   */
  raycastBody(
    event: MouseEvent,
    camera: PerspectiveCamera,
    canvasRect: DOMRect,
  ): string | null {
    this.mouseNDC.x =
      ((event.clientX - canvasRect.left) / canvasRect.width) * 2 - 1;
    this.mouseNDC.y =
      -((event.clientY - canvasRect.top) / canvasRect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouseNDC, camera);

    const intersects = this.raycaster.intersectObjects(
      this.interactionMeshes,
      false,
    );

    if (intersects.length > 0) {
      let hitObject: Object3D | null = intersects[0].object;
      while (hitObject) {
        if (hitObject.userData?.bodyId) {
          return hitObject.userData.bodyId as string;
        }
        hitObject = hitObject.parent;
      }
    }

    return null;
  }

  /**
   * Determine which celestial bodies are occluded (hidden behind other bodies)
   * from the camera's perspective. Raycasts from the camera toward each body's
   * center and checks whether the first intersection belongs to a different body.
   *
   * @param {PerspectiveCamera} camera - The scene camera
   * @param {Map<string, { mesh: Object3D }>} entries - Map of body ID to mesh entry
   * @returns {Set<string>} Set of body IDs that are currently occluded
   */
  computeOcclusion(
    camera: PerspectiveCamera,
    entries: Map<string, { mesh: Object3D }>,
  ): Set<string> {
    const occluded = new Set<string>();

    entries.forEach((entry, id) => {
      this.tempDir.subVectors(entry.mesh.position, camera.position).normalize();
      this.raycaster.set(camera.position, this.tempDir);

      const hits = this.raycaster.intersectObjects(this.occlusionMeshes, false);

      if (hits.length > 0) {
        let hitObj: Object3D | null = hits[0].object;
        while (hitObj && !hitObj.userData?.bodyId) {
          hitObj = hitObj.parent;
        }
        if (hitObj && hitObj.userData?.bodyId !== id) {
          occluded.add(id);
        }
      }
    });

    return occluded;
  }
}
