/**
 * @fileoverview Planet Renderer — Sphere with Surface Features
 * @description Renders terrestrial planets (like Damocles / Selkara / Mana) as
 * solid spheres with customizable base color and optional atmosphere glow.
 * Supports slow axial rotation.
 *
 * @module worldSim/celestials/PlanetRenderer
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
  AdditiveBlending,
  BackSide,
  Color,
  Mesh,
  MeshPhongMaterial,
  Object3D,
  ShaderMaterial,
  SphereGeometry,
} from 'three';
import { createCelestialGlow } from './CelestialGlow';
import type {
  BoundaryData,
  CelestialBodyData,
  ICelestialRenderer,
  SceneContext,
} from './interfaces';

/** @constant {number} DEFAULT_ROTATION_SPEED - Default planet axial rotation (radians/sec) */
const DEFAULT_ROTATION_SPEED = 0.05;

/** @constant {number} ATMOSPHERE_SCALE - Scale of atmosphere shell relative to planet radius */
const ATMOSPHERE_SCALE = 1.08;

/**
 * Vertex shader for the atmosphere glow effect.
 * @constant {string}
 */
const ATMOSPHERE_VERT = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Fragment shader for the atmosphere glow effect.
 * @constant {string}
 */
const ATMOSPHERE_FRAG = `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0) * uIntensity;
    gl_FragColor = vec4(uColor, intensity);
  }
`;

/**
 * Renders terrestrial planet bodies with solid surface and optional atmosphere.
 *
 * @class PlanetRenderer
 * @implements {ICelestialRenderer}
 */
export class PlanetRenderer implements ICelestialRenderer {
  /** @property {number} rotationSpeed - Axial rotation speed in rad/s */
  private rotationSpeed: number = DEFAULT_ROTATION_SPEED;

  /**
   * Create a planet mesh with optional atmosphere shell.
   *
   * @param {CelestialBodyData | BoundaryData} data - Body definition data
   * @returns {Object3D} Group containing the planet and optional atmosphere
   */
  createMesh(data: CelestialBodyData | BoundaryData): Object3D {
    const group = new Object3D();
    group.name = `planet-${data.id}`;

    const config = data.renderConfig;
    const baseColor = new Color((config.baseColor as string) ?? '#4488cc');
    this.rotationSpeed =
      (config.rotationSpeed as number) ?? DEFAULT_ROTATION_SPEED;

    const geometry = new SphereGeometry(data.radius, 48, 48);
    const material = new MeshPhongMaterial({
      color: baseColor,
      shininess: 20,
      flatShading: false,
    });

    const planetMesh = new Mesh(geometry, material);
    planetMesh.name = 'planet-surface';
    group.add(planetMesh);

    const glowColor =
      (config.atmosphereColor as string) ??
      (config.baseColor as string) ??
      '#4488cc';
    const glow = createCelestialGlow(data.radius, glowColor);
    group.add(glow);

    if (config.atmosphereColor) {
      const atmosphereColor = new Color(config.atmosphereColor as string);
      const atmosphereGeometry = new SphereGeometry(
        data.radius * ATMOSPHERE_SCALE,
        32,
        32,
      );
      const atmosphereMaterial = new ShaderMaterial({
        vertexShader: ATMOSPHERE_VERT,
        fragmentShader: ATMOSPHERE_FRAG,
        uniforms: {
          uColor: { value: atmosphereColor },
          uIntensity: { value: (config.atmosphereIntensity as number) ?? 1.5 },
        },
        transparent: true,
        blending: AdditiveBlending,
        side: BackSide,
        depthWrite: false,
      });

      const atmosphere = new Mesh(atmosphereGeometry, atmosphereMaterial);
      atmosphere.name = 'planet-atmosphere';
      group.add(atmosphere);
    }

    return group;
  }

  /**
   * Rotate the planet on its axis each frame.
   *
   * @param {Object3D} mesh - The planet group
   * @param {number} _time - Elapsed time
   * @param {number} deltaTime - Frame delta
   */
  update(
    mesh: Object3D,
    _time: number,
    deltaTime: number,
    _ctx: SceneContext,
  ): void {
    const surface = mesh.getObjectByName('planet-surface');
    if (surface) {
      surface.rotation.y += this.rotationSpeed * deltaTime;
    }
  }

  /**
   * Dispose of planet resources.
   *
   * @param {Object3D} mesh - The planet group
   */
  dispose(mesh: Object3D): void {
    mesh.traverse((child) => {
      if ('geometry' in child && child.geometry) {
        (child.geometry as SphereGeometry).dispose();
      }
      if ('material' in child && child.material) {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];
        for (const mat of materials) {
          mat.dispose();
        }
      }
    });
  }

  /**
   * Get LOD distance thresholds.
   *
   * @returns {{ near: number; far: number }} LOD thresholds
   */
  getLODDistance(): { near: number; far: number } {
    return { near: 30, far: 500 };
  }
}
