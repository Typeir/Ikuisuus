/**
 * @fileoverview Tower World Renderer — Impossibly Tall Vertical Structure with Orbiting Pillars
 * @description Renders Selkara as an impossibly tall tapered tower (no planet base)
 * surrounded by smaller pillars orbiting at random distances and heights.
 * Stacked cylinder segments that taper upward evoke the lore of the
 * mile-wide, sky-piercing tower formed from the Golden One's marrow and spine.
 *
 * @module worldSim/celestials/TowerWorldRenderer
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
  Color,
  CylinderGeometry,
  Mesh,
  MeshPhongMaterial,
  Object3D,
} from 'three';
import { createCelestialGlow } from './CelestialGlow';
import { disposeSceneGraph } from './disposeUtils';
import type {
  BoundaryData,
  CelestialBodyData,
  ICelestialRenderer,
  SceneContext,
  TowerWorldRenderConfig,
} from './interfaces';

/** @constant {number} TOWER_SEGMENTS - Number of cylinder segments composing the main tower */
const TOWER_SEGMENTS = 5;

/** @constant {number} DEFAULT_ROTATION_SPEED - Rotation speed of the tower */
const DEFAULT_ROTATION_SPEED = 0.03;

/** @constant {number} ORBITER_COUNT - Number of smaller pillars orbiting the main tower */
const ORBITER_COUNT = 10;

/** @constant {number} ORBITER_BASE_SPEED - Base orbital speed for orbiting pillars (rad/s) */
const ORBITER_BASE_SPEED = 0.48;

/**
 * Simple deterministic pseudo-random number generator using a hash-style seed.
 * Produces values in [0, 1) that are stable across sessions for a given seed.
 *
 * @param {number} seed - Seed value
 * @returns {number} Pseudo-random value between 0 and 1
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Renders a tower world: a thick tapered stick of stacked cylinder segments
 * surrounded by smaller orbiting pillars at random radii and heights.
 *
 * @class TowerWorldRenderer
 * @implements {ICelestialRenderer}
 */
export class TowerWorldRenderer implements ICelestialRenderer {
  /** @property {number} rotationSpeed - Tower rotation speed */
  private rotationSpeed: number = DEFAULT_ROTATION_SPEED;

  /** @property {number} orbiterCount - Number of orbiting pillars */
  private orbiterCount: number = ORBITER_COUNT;

  /** @property {Object3D[]} orbiterPivots - Stored references to orbiter pivot objects */
  private orbiterPivots: Object3D[] = [];

  /**
   * Create the tower world mesh: a thick tapered tower with orbiting pillars.
   *
   * @param {CelestialBodyData | BoundaryData} data - Body definition data
   * @returns {Object3D} Group containing the tower, orbiters, and glow
   */
  createMesh(data: CelestialBodyData | BoundaryData): Object3D {
    const group = new Object3D();
    group.name = `towerWorld-${data.id}`;

    const config = data.renderConfig as TowerWorldRenderConfig;
    const towerColor = new Color((config.towerColor as string) ?? '#aaaaaa');
    this.rotationSpeed =
      (config.rotationSpeed as number) ?? DEFAULT_ROTATION_SPEED;

    const towerHeight =
      data.radius * ((config.towerHeightMultiplier as number) ?? 8);
    const segmentHeight = towerHeight / TOWER_SEGMENTS;
    const baseRadius = data.radius * 0.55;

    for (let i = 0; i < TOWER_SEGMENTS; i++) {
      const taper = 1 - (i / TOWER_SEGMENTS) * 0.4;
      const topTaper = 1 - ((i + 1) / TOWER_SEGMENTS) * 0.4;
      const segmentGeometry = new CylinderGeometry(
        baseRadius * topTaper,
        baseRadius * taper,
        segmentHeight,
        14,
      );

      const shade = 0.85 + (i / TOWER_SEGMENTS) * 0.15;
      const segmentMaterial = new MeshPhongMaterial({
        color: towerColor.clone().multiplyScalar(shade),
        emissive: towerColor.clone().multiplyScalar(shade * 0.4),
        emissiveIntensity: 1.0,
        shininess: 40,
      });

      const segment = new Mesh(segmentGeometry, segmentMaterial);
      segment.position.y = segmentHeight * (i + 0.5) - towerHeight * 0.5;
      segment.name = `tower-segment-${i}`;
      group.add(segment);
    }

    this.orbiterCount = ORBITER_COUNT;
    for (let i = 0; i < this.orbiterCount; i++) {
      const r1 = seededRandom(i * 3 + 1);
      const r2 = seededRandom(i * 3 + 2);
      const r3 = seededRandom(i * 3 + 3);
      const r4 = seededRandom(i * 3 + 4);

      const pillarHeight = segmentHeight * (0.3 + r1 * 0.7);
      const pillarRadius = baseRadius * (0.1 + r2 * 0.15);
      const orbitRadius = baseRadius * (1.8 + r3 * 2.5);
      const heightOffset = (r4 - 0.5) * towerHeight * 0.7;

      const pillarGeometry = new CylinderGeometry(
        pillarRadius * 0.7,
        pillarRadius,
        pillarHeight,
        8,
      );
      const shade = 0.7 + r1 * 0.3;
      const pillarMaterial = new MeshPhongMaterial({
        color: towerColor.clone().multiplyScalar(shade),
        emissive: towerColor.clone().multiplyScalar(shade * 0.4),
        emissiveIntensity: 1.0,
        shininess: 30,
      });
      const pillar = new Mesh(pillarGeometry, pillarMaterial);
      pillar.position.x = orbitRadius;
      pillar.position.y = heightOffset;

      const pillarGlow = createCelestialGlow(
        pillarRadius * 2,
        (config.towerColor as string) ?? '#aaaaaa',
        8.0,
        0.35,
      );
      pillarGlow.position.x = orbitRadius;
      pillarGlow.position.y = heightOffset;

      const pivot = new Object3D();
      pivot.name = `orbiter-pivot-${i}`;
      pivot.rotation.y = r3 * Math.PI * 2;
      pivot.add(pillar);
      pivot.add(pillarGlow);

      group.add(pivot);
      this.orbiterPivots.push(pivot);
    }

    const glowColor = (config.towerColor as string) ?? '#aaaaaa';
    const glow = createCelestialGlow(data.radius, glowColor, 8.0, 0.35);
    group.add(glow);

    return group;
  }

  /**
   * Rotate the main tower and spin orbiting pillars each frame.
   *
   * @param {Object3D} mesh - The tower world group
   * @param {number} _time - Elapsed time
   * @param {number} deltaTime - Frame delta
   */
  update(
    mesh: Object3D,
    _time: number,
    deltaTime: number,
    _ctx: SceneContext,
  ): void {
    mesh.rotation.y += this.rotationSpeed * deltaTime;

    for (let i = 0; i < this.orbiterPivots.length; i++) {
      const pivot = this.orbiterPivots[i];
      const speed = ORBITER_BASE_SPEED * (1 + seededRandom(i * 7) * 0.6);
      const direction = i % 2 === 0 ? 1 : -1;
      pivot.rotation.y += speed * direction * deltaTime;
    }
  }

  /**
   * Dispose of tower world resources.
   *
   * @param {Object3D} mesh - The tower world group
   */
  dispose(mesh: Object3D): void {
    disposeSceneGraph(mesh);
  }
}
