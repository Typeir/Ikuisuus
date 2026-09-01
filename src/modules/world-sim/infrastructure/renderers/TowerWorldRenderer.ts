/**
 * @fileoverview Tower World Renderer — Impossibly Tall Vertical Structure with Orbiting Pillars
 * @description Renders a tapered tower of stacked cylinder segments (no planet base)
 * surrounded by smaller pillars orbiting at random radii and heights.
 *
 * @module modules/world-sim/infrastructure/renderers/TowerWorldRenderer
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
    CylinderGeometry,
    Mesh,
    Object3D,
    ShaderMaterial,
    Vector3,
} from 'three';
import type { RenderQualityLevel } from '@/modules/world-sim/application/services/AdaptivePerformanceController';
import {
    MAX_VISIBLE_ORBITERS,
    ORBITER_CYLINDER_HEIGHT,
    ORBITER_CYLINDER_RADIAL,
    TOWER_CYLINDER_HEIGHT,
    TOWER_CYLINDER_RADIAL,
} from '@/modules/world-sim/infrastructure/geometry/budgets/GeometryBudgets';
import towerFrag from '../../shaders/tower.frag.glsl';
import towerVert from '../../shaders/tower.vert.glsl';
import { createCelestialGlow } from '@/modules/world-sim/infrastructure/effects/CelestialGlow';
import { disposeSceneGraph } from '@/modules/world-sim/infrastructure/geometry/disposeUtils';
import type {
    BoundaryData,
    CelestialBodyData,
    ICelestialRenderer,
    SceneContext,
    TowerWorldRenderConfig,
} from '@/modules/world-sim/domain/celestials/celestialBody.types';
import { extractColor } from '@/modules/world-sim/infrastructure/renderers/renderConfigHelpers';
import { createDisplacedShaderMaterial } from '@/modules/world-sim/infrastructure/renderers/shaderMaterialFactory';

/** @constant {number} TOWER_SEGMENTS - Number of cylinder segments composing the main tower */
const TOWER_SEGMENTS = 5;

/** @constant {number} DEFAULT_ROTATION_SPEED - Rotation speed of the tower */
const DEFAULT_ROTATION_SPEED = 0.03;

/** @constant {number} ORBITER_COUNT - Number of smaller pillars orbiting the main tower */
const ORBITER_COUNT = 10;

/** @constant {number} ORBITER_BASE_SPEED - Base orbital speed for orbiting pillars (rad/s) */
const ORBITER_BASE_SPEED = 0.48;

/** @constant {number} DEFAULT_TOWER_NOISE_SCALE - Noise sampling scale for tower surface detail */
const DEFAULT_TOWER_NOISE_SCALE = 0.6;

/** @constant {number} DEFAULT_TOWER_DISPLACEMENT - Vertex displacement amplitude for carved stone */
const DEFAULT_TOWER_DISPLACEMENT = 0.2;

/** @constant {string} DEFAULT_RIDGE_COLOR - Default ridge accent colour for tower */
const DEFAULT_RIDGE_COLOR = '#d4c8a0';

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

  /** @property {ShaderMaterial[]} towerMaterials - All tower/pillar shader materials for time updates */
  private towerMaterials: ShaderMaterial[] = [];

  /** @property {RenderQualityLevel} qualityLevel - Current adaptive quality level */
  private qualityLevel: RenderQualityLevel = 'high';

  /**
   * Apply adaptive quality level to tower shader detail.
   *
   * @param {RenderQualityLevel} level - New quality level
   */
  setQualityLevel(level: RenderQualityLevel): void {
    this.qualityLevel = level;

    const maxOrbiters = MAX_VISIBLE_ORBITERS[level];
    for (let i = 0; i < this.orbiterPivots.length; i++) {
      this.orbiterPivots[i].visible = i < maxOrbiters;
    }
  }

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
    const towerColor = extractColor(
      config as unknown as Record<string, unknown>,
      'towerColor',
      '#aaaaaa',
    );
    const ridgeColor = extractColor(
      config as unknown as Record<string, unknown>,
      'towerRidgeColor',
      DEFAULT_RIDGE_COLOR,
    );
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
        TOWER_CYLINDER_RADIAL,
        TOWER_CYLINDER_HEIGHT,
      );

      const shade = 0.85 + (i / TOWER_SEGMENTS) * 0.15;
      const segmentMaterial = createDisplacedShaderMaterial({
        vertexShader: towerVert,
        fragmentShader: towerFrag,
        uniforms: {
          uTime: { value: 0 },
          uNoiseScale: { value: DEFAULT_TOWER_NOISE_SCALE },
          uDisplacementScale: { value: DEFAULT_TOWER_DISPLACEMENT },
          uBaseColor: { value: towerColor.clone().multiplyScalar(shade) },
          uRidgeColor: { value: ridgeColor.clone().multiplyScalar(shade) },
          uLightDir: { value: new Vector3(1, 0.5, 0.5).normalize() },
          uAmbient: { value: 0.35 },
        },
      });

      const segment = new Mesh(segmentGeometry, segmentMaterial);
      segment.position.y = segmentHeight * (i + 0.5) - towerHeight * 0.5;
      segment.name = `tower-segment-${i}`;
      segment.frustumCulled = false;
      group.add(segment);
      this.towerMaterials.push(segmentMaterial);
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
        ORBITER_CYLINDER_RADIAL,
        ORBITER_CYLINDER_HEIGHT,
      );
      const shade = 0.7 + r1 * 0.3;
      const pillarMaterial = createDisplacedShaderMaterial({
        vertexShader: towerVert,
        fragmentShader: towerFrag,
        uniforms: {
          uTime: { value: 0 },
          uNoiseScale: { value: DEFAULT_TOWER_NOISE_SCALE * 1.5 },
          uDisplacementScale: { value: DEFAULT_TOWER_DISPLACEMENT * 0.6 },
          uBaseColor: { value: towerColor.clone().multiplyScalar(shade) },
          uRidgeColor: { value: ridgeColor.clone().multiplyScalar(shade) },
          uLightDir: { value: new Vector3(1, 0.5, 0.5).normalize() },
          uAmbient: { value: 0.35 },
        },
      });
      const pillar = new Mesh(pillarGeometry, pillarMaterial);
      pillar.position.x = orbitRadius;
      pillar.position.y = heightOffset;
      pillar.frustumCulled = false;
      this.towerMaterials.push(pillarMaterial);

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

    this.setQualityLevel(this.qualityLevel);

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

    for (const mat of this.towerMaterials) {
      mat.uniforms.uTime.value = _time;
    }

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
