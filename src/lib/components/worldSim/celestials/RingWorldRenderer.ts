/**
 * @fileoverview Ring World Renderer — Frozen Core with Orbiting Rings
 * @description Renders Mana as a small frozen ice core surrounded by multiple
 * independently spinning torus rings at varying radii and tilts. Each ring
 * rotates at a different speed and axis angle, creating a dynamic orrery-like
 * appearance.
 *
 * @module worldSim/celestials/RingWorldRenderer
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
  Color,
  DoubleSide,
  Mesh,
  MeshPhongMaterial,
  Object3D,
  SphereGeometry,
  TorusGeometry,
} from 'three';
import { createCelestialGlow } from './CelestialGlow';
import { disposeSceneGraph } from './disposeUtils';
import type {
  BoundaryData,
  CelestialBodyData,
  ICelestialRenderer,
  RingWorldRenderConfig,
  SceneContext,
} from './interfaces';

/** @constant {number} DEFAULT_RING_COUNT - Default number of orbiting rings */
const DEFAULT_RING_COUNT = 7;

/** @constant {number} DEFAULT_CORE_RADIUS_RATIO - Core radius as fraction of body radius */
const DEFAULT_CORE_RADIUS_RATIO = 0.32;

/** @constant {number} DEFAULT_RING_TUBE_RADIUS - Tube radius of each torus ring */
const DEFAULT_RING_TUBE_RADIUS = 0.4;

/** @constant {number} DEFAULT_RING_SPACING - Distance between successive ring radii */
const DEFAULT_RING_SPACING = 3.2;

/** @constant {number} DEFAULT_BASE_ROTATION_SPEED - Base rotation speed for the outermost ring (rad/s) */
const DEFAULT_BASE_ROTATION_SPEED = 0.12;

/** @constant {number} RING_TILT_MAX - Maximum tilt angle in radians for ring variation */
const RING_TILT_MAX = 0.35;

/**
 * Renders a ring world as a frozen core sphere surrounded by independently
 * spinning rings at different radii and tilt angles.
 *
 * @class RingWorldRenderer
 * @implements {ICelestialRenderer}
 */
export class RingWorldRenderer implements ICelestialRenderer {
  /** @property {number} baseRotationSpeed - Base rotation speed for computing per-ring speeds */
  private baseRotationSpeed: number = DEFAULT_BASE_ROTATION_SPEED;

  /** @property {number} ringCount - Number of rings around the core */
  private ringCount: number = DEFAULT_RING_COUNT;

  /** @property {Object3D[]} ringPivots - Stored references to ring pivot objects */
  private ringPivots: Object3D[] = [];

  /**
   * Create the ring world mesh: a frozen core sphere with multiple torus rings.
   *
   * @param {CelestialBodyData | BoundaryData} data - Body definition data
   * @returns {Object3D} Group containing the core and all rings
   */
  createMesh(data: CelestialBodyData | BoundaryData): Object3D {
    const group = new Object3D();
    group.name = `ringWorld-${data.id}`;

    const config = data.renderConfig as RingWorldRenderConfig;
    const coreColor = new Color((config.coreColor as string) ?? '#c8dde8');
    const ringColor = new Color((config.ringColor as string) ?? '#9ab8d0');
    this.ringCount = (config.ringCount as number) ?? DEFAULT_RING_COUNT;
    this.baseRotationSpeed =
      (config.rotationSpeed as number) ?? DEFAULT_BASE_ROTATION_SPEED;

    const coreRadius =
      (config.coreRadius as number) ?? data.radius * DEFAULT_CORE_RADIUS_RATIO;
    const ringSpacing = (config.ringSpacing as number) ?? DEFAULT_RING_SPACING;
    const tubeRadius =
      (config.ringTubeRadius as number) ?? DEFAULT_RING_TUBE_RADIUS;

    const coreGeometry = new SphereGeometry(coreRadius, 32, 32);
    const coreMaterial = new MeshPhongMaterial({
      color: coreColor,
      emissive: coreColor,
      emissiveIntensity: 0.35,
      shininess: 80,
    });
    const coreMesh = new Mesh(coreGeometry, coreMaterial);
    coreMesh.name = 'ring-core';
    group.add(coreMesh);

    const startRadius = coreRadius + ringSpacing;

    for (let i = 0; i < this.ringCount; i++) {
      const ringRadius = startRadius + i * ringSpacing;
      const shade = 0.7 + (i / this.ringCount) * 0.3;

      const torusGeometry = new TorusGeometry(ringRadius, tubeRadius, 8, 80);
      const torusMaterial = new MeshPhongMaterial({
        color: ringColor.clone().multiplyScalar(shade),
        emissive: ringColor,
        emissiveIntensity: 0.05,
        shininess: 40,
        side: DoubleSide,
      });

      const ringPivot = new Object3D();
      ringPivot.name = `ring-pivot-${i}`;

      const ring = new Mesh(torusGeometry, torusMaterial);
      ring.name = `ring-${i}`;
      ring.rotation.x = Math.PI / 2;
      ringPivot.add(ring);

      const tiltAngle =
        ((i % 3) - 1) * RING_TILT_MAX * ((i + 1) / this.ringCount);
      ringPivot.rotation.x = tiltAngle;
      ringPivot.rotation.z = tiltAngle * 0.5;

      group.add(ringPivot);
      this.ringPivots.push(ringPivot);
    }

    const glowColor = (config.coreColor as string) ?? '#c8dde8';
    const glow = createCelestialGlow(data.radius, glowColor, 2.5, 0.12);
    group.add(glow);

    return group;
  }

  /**
   * Spin each ring at a different speed each frame. Inner rings spin faster.
   *
   * @param {Object3D} mesh - The ring world group
   * @param {number} _time - Elapsed time
   * @param {number} deltaTime - Frame delta
   */
  update(
    mesh: Object3D,
    _time: number,
    deltaTime: number,
    _ctx: SceneContext,
  ): void {
    for (let i = 0; i < this.ringPivots.length; i++) {
      const pivot = this.ringPivots[i];
      const speedMultiplier = (this.ringCount - i) / this.ringCount;
      const direction = i % 2 === 0 ? 1 : -1;
      pivot.rotation.y +=
        this.baseRotationSpeed * speedMultiplier * direction * deltaTime;
    }
  }

  /**
   * Dispose of ring world resources.
   *
   * @param {Object3D} mesh - The ring world group
   */
  dispose(mesh: Object3D): void {
    disposeSceneGraph(mesh);
  }
}
