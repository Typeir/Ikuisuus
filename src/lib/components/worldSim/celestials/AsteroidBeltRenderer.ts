/**
 * @fileoverview Asteroid Belt Renderer — Procedural Particle Ring
 * @description Renders the Opaline Belt as a scattered ring of point particles
 * orbiting Kultharja. Uses instanced points with varying sizes and a slow
 * collective rotation.
 *
 * @module worldSim/celestials/AsteroidBeltRenderer
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
    BufferGeometry,
    Color,
    Float32BufferAttribute,
    Object3D,
    Points,
    PointsMaterial,
} from 'three';
import { createCelestialGlow } from './CelestialGlow';
import { disposeSceneGraph } from './disposeUtils';
import type {
    AsteroidBeltRenderConfig,
    BoundaryData,
    CelestialBodyData,
    ICelestialRenderer,
    SceneContext,
} from './interfaces';

/** @constant {number} DEFAULT_PARTICLE_COUNT - Default number of asteroid particles */
const DEFAULT_PARTICLE_COUNT = 600;

/** @constant {number} DEFAULT_ROTATION_SPEED - Collective rotation speed */
const DEFAULT_ROTATION_SPEED = 0.005;

/** @constant {number} BELT_THICKNESS - Vertical scatter thickness of the belt */
const BELT_THICKNESS = 3;

/**
 * Renders an asteroid belt as a ring of point particles.
 *
 * @class AsteroidBeltRenderer
 * @implements {ICelestialRenderer}
 */
export class AsteroidBeltRenderer implements ICelestialRenderer {
  /** @property {number} rotationSpeed - Collective belt rotation speed */
  private rotationSpeed: number = DEFAULT_ROTATION_SPEED;

  /**
   * Create the asteroid belt as a Points object with scattered particles.
   *
   * @param {CelestialBodyData | BoundaryData} data - Body definition data
   * @returns {Object3D} Points object representing the asteroid belt
   */
  createMesh(data: CelestialBodyData | BoundaryData): Object3D {
    const group = new Object3D();
    group.name = `asteroidBelt-${data.id}`;

    const config = data.renderConfig as AsteroidBeltRenderConfig;
    const particleCount =
      (config.particleCount as number) ?? DEFAULT_PARTICLE_COUNT;
    const innerRadius = (config.innerRadius as number) ?? data.radius * 0.8;
    const outerRadius = (config.outerRadius as number) ?? data.radius * 1.2;
    const color = new Color((config.baseColor as string) ?? '#aabbcc');
    this.rotationSpeed =
      (config.rotationSpeed as number) ?? DEFAULT_ROTATION_SPEED;

    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
      const i3 = i * 3;

      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = (Math.random() - 0.5) * BELT_THICKNESS;
      positions[i3 + 2] = Math.sin(angle) * radius;
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));

    const material = new PointsMaterial({
      color,
      size: 1.2,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.7,
    });

    const points = new Points(geometry, material);
    points.name = 'belt-particles';
    group.add(points);

    const glowColor = (config.baseColor as string) ?? '#aabbcc';
    const glow = createCelestialGlow(data.radius, glowColor, 2.0, 0.1);
    group.add(glow);

    return group;
  }

  /**
   * Rotate the asteroid belt collectively each frame.
   *
   * @param {Object3D} mesh - The belt group
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
  }

  /**
   * Dispose of asteroid belt resources.
   *
   * @param {Object3D} mesh - The belt group
   */
  dispose(mesh: Object3D): void {
    disposeSceneGraph(mesh);
  }
}
