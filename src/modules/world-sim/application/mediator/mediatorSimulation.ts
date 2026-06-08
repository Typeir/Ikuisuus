/**
 * @fileoverview Mediator Simulation Helpers
 * @description Extracted orbital and collision update logic from WorldSimMediator.
 * Runs during RenderPhase.Update — advances orbital positions, ticks renderer strategies,
 * and propagates collision-cloud positions each frame.
 *
 * @module modules/world-sim/application/mediator/mediatorSimulation
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type {
    ICelestialRenderer,
    SceneContext,
} from '@/modules/world-sim/domain/celestials/celestialBody.types';
import { computeOrbitalPosition } from '@/modules/world-sim/domain/celestials/orbitalMechanics';
import type {
    CelestialEntry,
    CollisionCloudEntry,
} from '@/modules/world-sim/infrastructure/geometry/factories/CelestialSceneBuilder';
import type { Object3D } from 'three';

/**
 * Advance all celestial orbital positions and tick renderer strategies for one frame.
 * Handles parent-relative positioning and calls renderer.update() for each body.
 *
 * @param {Map<string, CelestialEntry>} celestials - All active celestial entries
 * @param {SceneContext} ctx - Current frame scene context
 * @param {number} time - Accumulated simulation time
 * @param {number} simDeltaTime - Simulation-speed-scaled delta time
 */
export function runCelestialSimulation(
  celestials: Map<string, CelestialEntry>,
  ctx: SceneContext,
  time: number,
  simDeltaTime: number,
): void {
  celestials.forEach((entry) => {
    if (entry.data.orbit) {
      const orbitalOffset = computeOrbitalPosition(entry.data.orbit, time);

      if (entry.data.parentBodyId) {
        const parentEntry = celestials.get(entry.data.parentBodyId);
        if (parentEntry) {
          entry.mesh.position
            .copy(parentEntry.mesh.position)
            .add(orbitalOffset);
        } else {
          entry.mesh.position.copy(orbitalOffset);
        }
      } else {
        entry.mesh.position.copy(orbitalOffset);
      }
    } else if (entry.data.parentBodyId) {
      const parentEntry = celestials.get(entry.data.parentBodyId);
      if (parentEntry) {
        entry.mesh.position.copy(parentEntry.mesh.position);
      }
    }

    entry.renderer.update(entry.mesh, time, simDeltaTime, ctx);
  });
}

/**
 * Tick the Everdark boundary renderer, if present.
 *
 * @param {ICelestialRenderer | null} everdarkRenderer - The Everdark renderer
 * @param {Object3D | null} everdarkMesh - The Everdark mesh
 * @param {SceneContext} ctx - Current frame scene context
 * @param {number} time - Accumulated simulation time
 * @param {number} simDeltaTime - Simulation-speed-scaled delta time
 */
export function runEverdarkSimulation(
  everdarkRenderer: ICelestialRenderer | null,
  everdarkMesh: Object3D | null,
  ctx: SceneContext,
  time: number,
  simDeltaTime: number,
): void {
  if (everdarkRenderer && everdarkMesh) {
    everdarkRenderer.update(everdarkMesh, time, simDeltaTime, ctx);
  }
}

/**
 * Update all active collision-cloud pair positions to track their parent bodies.
 *
 * @param {Map<string, CollisionCloudEntry>} collisionClouds - Active cloud effect map
 * @param {Map<string, CelestialEntry>} celestials - All active celestial entries
 * @param {number} time - Accumulated simulation time
 * @param {number} simDeltaTime - Simulation-speed-scaled delta time
 */
export function runCollisionSimulation(
  collisionClouds: Map<string, CollisionCloudEntry>,
  celestials: Map<string, CelestialEntry>,
  time: number,
  simDeltaTime: number,
): void {
  if (collisionClouds.size === 0) return;
  collisionClouds.forEach(({ pair, effect }) => {
    const a = celestials.get(pair.bodyAId);
    const b = celestials.get(pair.bodyBId);
    if (!a || !b) return;
    effect.update({
      bodyAPosition: a.mesh.position,
      bodyBPosition: b.mesh.position,
      bodyARadius: a.data.radius,
      bodyBRadius: b.data.radius,
      time,
      deltaTime: simDeltaTime,
    });
  });
}
