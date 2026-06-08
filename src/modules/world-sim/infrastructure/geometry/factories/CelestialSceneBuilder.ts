/**
 * @fileoverview Celestial Scene Builder
 * @description Pure construction helpers that build the celestial body meshes,
 * orbit lines, Everdark boundary, and collision cloud effect. Extracted from
 * `WorldSimMediator` so the mediator can focus on lifecycle coordination
 * rather than scene assembly.
 *
 * @module worldSim/celestials/CelestialSceneBuilder
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { Mesh, Object3D, Scene } from 'three';
import { CelestialBodyFactory } from '@/modules/world-sim/infrastructure/geometry/factories/CelestialBodyFactory';
import type { CelestialRegistry } from '@/modules/world-sim/domain/celestials/celestialRegistry';
import { CollisionCloudEffect } from '@/modules/world-sim/infrastructure/effects/CollisionCloudEffect';
import type {
    CelestialBodyData,
    CelestialRendererType,
    CollisionPairData,
    ICelestialRenderer,
} from '@/modules/world-sim/domain/celestials/celestialBody.types';
import { computeOrbitalPosition } from '@/modules/world-sim/domain/celestials/orbitalMechanics';
import { createAllOrbitLines } from '@/modules/world-sim/infrastructure/geometry/factories/OrbitLineFactory';

/**
 * Runtime entry for a celestial body in the scene.
 *
 * @interface CelestialEntry
 * @property {CelestialBodyData} data - The body's data definition
 * @property {ICelestialRenderer} renderer - The renderer strategy instance
 * @property {Object3D} mesh - The Three.js scene object
 */
export interface CelestialEntry {
  /** @property {CelestialBodyData} data - Body configuration data */
  data: CelestialBodyData;
  /** @property {ICelestialRenderer} renderer - Renderer strategy instance */
  renderer: ICelestialRenderer;
  /** @property {Object3D} mesh - Scene object created by the renderer */
  mesh: Object3D;
}

/**
 * Result of constructing the Everdark boundary shell.
 *
 * @interface EverdarkBuildResult
 * @property {Object3D} mesh - The Everdark boundary mesh
 * @property {ICelestialRenderer} renderer - The renderer driving the mesh
 */
export interface EverdarkBuildResult {
  /** @property {Object3D} mesh - The boundary mesh added to the scene */
  mesh: Object3D;
  /** @property {ICelestialRenderer} renderer - Renderer strategy for the boundary */
  renderer: ICelestialRenderer;
}

/**
 * Apply default frustum-culling flags to all renderable descendants.
 *
 * @param {Object3D} root - Root object to traverse
 */
export function applyDefaultCulling(root: Object3D): void {
  root.traverse((node) => {
    if ('frustumCulled' in node) {
      node.frustumCulled = true;
    }
  });
}

/**
 * Construct mesh entries for every celestial body in the registry, add them
 * to the scene, and return a map keyed by body ID.
 *
 * @param {CelestialRegistry} registry - The body data source
 * @param {Scene} scene - The Three.js scene to add meshes to
 * @returns {Map<string, CelestialEntry>} Celestials keyed by body ID
 */
export function buildCelestialBodies(
  registry: CelestialRegistry,
  scene: Scene,
): Map<string, CelestialEntry> {
  const celestials = new Map<string, CelestialEntry>();
  const bodies = registry.getAllBodies();

  for (const body of bodies) {
    const renderer = CelestialBodyFactory.createRenderer(
      body.renderConfig.renderer as CelestialRendererType,
    );
    const mesh = renderer.createMesh(body);

    if (body.orbit) {
      const initialPosition = computeOrbitalPosition(body.orbit, 0);
      mesh.position.copy(initialPosition);
    }

    mesh.userData = { bodyId: body.id };
    applyDefaultCulling(mesh);

    scene.add(mesh);
    celestials.set(body.id, { data: body, renderer, mesh });
  }

  return celestials;
}

/**
 * Build orbit path lines for all bodies with orbital parameters. Lines for
 * child bodies (with `parentBodyId`) are parented to the parent mesh so they
 * move with the parent. Top-level orbit lines are added to the scene root.
 *
 * @param {CelestialRegistry} registry - The body data source
 * @param {Map<string, CelestialEntry>} celestials - Existing celestial entries
 * @param {Scene} scene - The scene root to attach top-level lines to
 * @returns {Map<string, Mesh>} Orbit lines keyed by body ID
 */
export function buildOrbitLines(
  registry: CelestialRegistry,
  celestials: Map<string, CelestialEntry>,
  scene: Scene,
): Map<string, Mesh> {
  const meshMap = new Map<string, Object3D>();
  celestials.forEach((entry, id) => {
    meshMap.set(id, entry.mesh);
  });

  const orbitLines = createAllOrbitLines(registry.getAllBodies(), meshMap);

  orbitLines.forEach((line, bodyId) => {
    const bodyData = registry.getBodyById(bodyId);
    if (!bodyData?.parentBodyId) {
      scene.add(line);
    }
  });

  return orbitLines;
}

/**
 * Construct the Everdark boundary shell and add it to the scene.
 *
 * @param {CelestialRegistry} registry - The body data source
 * @param {Scene} scene - The scene to add the boundary mesh to
 * @returns {EverdarkBuildResult} The mesh and renderer
 */
export function buildEverdark(
  registry: CelestialRegistry,
  scene: Scene,
): EverdarkBuildResult {
  const boundary = registry.getBoundary();
  const renderer = CelestialBodyFactory.createRenderer(
    boundary.renderConfig.renderer as CelestialRendererType,
  );
  const mesh = renderer.createMesh(boundary);
  applyDefaultCulling(mesh);
  scene.add(mesh);
  return { mesh, renderer };
}

/**
 * Result of constructing a single collision-cloud effect for a registered
 * `CollisionPairData`.
 *
 * @interface CollisionCloudEntry
 * @property {CollisionPairData} pair - The registry pair definition this effect represents
 * @property {CollisionCloudEffect} effect - The runtime effect instance owned by the scene
 */
export interface CollisionCloudEntry {
  pair: CollisionPairData;
  effect: CollisionCloudEffect;
}

/**
 * Construct one `CollisionCloudEffect` for every collision pair declared in
 * the registry where both referenced bodies are present in the celestials
 * map. Pairs referencing missing bodies are silently skipped.
 *
 * @param {CollisionPairData[]} pairs - Pair definitions from the registry
 * @param {Map<string, CelestialEntry>} celestials - Existing celestials map
 * @param {Scene} scene - The scene to add each effect's group to
 * @returns {Map<string, CollisionCloudEntry>} Effects keyed by pair id
 */
export function buildCollisionClouds(
  pairs: CollisionPairData[],
  celestials: Map<string, CelestialEntry>,
  scene: Scene,
): Map<string, CollisionCloudEntry> {
  const clouds = new Map<string, CollisionCloudEntry>();
  for (const pair of pairs) {
    const a = celestials.get(pair.bodyAId);
    const b = celestials.get(pair.bodyBId);
    if (!a || !b) continue;
    const effect = new CollisionCloudEffect(pair.id);
    effect.addToScene(scene);
    clouds.set(pair.id, { pair, effect });
  }
  return clouds;
}
