/**
 * @fileoverview Ring World Renderer — Frozen Core with Orbiting Rings
 * @description Renders Mana as a small frozen ice core surrounded by multiple
 * independently spinning torus rings at varying radii and tilts. Each ring
 * rotates at a different speed and axis angle, creating a dynamic orrery-like
 * appearance. Optionally applies noise-displaced icy surface shaders to the core.
 *
 * @module worldSim/celestials/RingWorldRenderer
 * @version 3.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
    Color,
    DoubleSide,
    Mesh,
    MeshPhongMaterial,
    Object3D,
    ShaderMaterial,
    TorusGeometry,
    Vector3,
} from 'three';
import type { RenderQualityLevel } from '@/modules/world-sim/application/services/AdaptivePerformanceController';
import {
    createSphereLODSet,
    disposeSphereLODSet,
    ICY_CORE_LOD,
    MAX_VISIBLE_RINGS,
    TORUS_RADIAL_SEGMENTS,
    TORUS_TUBULAR_SEGMENTS,
    type SphereLODSet,
} from '@/modules/world-sim/infrastructure/geometry/budgets/GeometryBudgets';
import icyCoreFrag from '../../shaders/icyCore.frag.glsl';
import icyCoreVert from '../../shaders/icyCore.vert.glsl';
import ringWorldFrag from '../../shaders/ringWorld.frag.glsl';
import ringWorldVert from '../../shaders/ringWorld.vert.glsl';
import { createCelestialGlow } from '@/modules/world-sim/infrastructure/effects/CelestialGlow';
import { disposeSceneGraph } from '@/modules/world-sim/infrastructure/geometry/disposeUtils';
import type {
    BoundaryData,
    CelestialBodyData,
    ICelestialRenderer,
    RingWorldRenderConfig,
    SceneContext,
} from '@/modules/world-sim/domain/celestials/celestialBody.types';
import { extractColor } from '@/modules/world-sim/infrastructure/renderers/renderConfigHelpers';
import { createDisplacedShaderMaterial } from '@/modules/world-sim/infrastructure/renderers/shaderMaterialFactory';

/** @constant {number} DEFAULT_RING_COUNT - Default number of orbiting rings */
const DEFAULT_RING_COUNT = 7;

/** @constant {number} DEFAULT_CORE_RADIUS_RATIO - Core radius as fraction of body radius */
const DEFAULT_CORE_RADIUS_RATIO = 0.32;

/** @constant {number} DEFAULT_RING_TUBE_RADIUS - Tube radius of each torus ring */
const DEFAULT_RING_TUBE_RADIUS = 0.4;

/** @constant {number} DEFAULT_BASE_ROTATION_SPEED - Base rotation speed for the outermost ring (rad/s) */
const DEFAULT_BASE_ROTATION_SPEED = 0.22;

/** @constant {number} DEFAULT_RING_SPACING - Distance between successive ring radii */
const DEFAULT_RING_SPACING = 4.5;

/** @constant {number} RING_TILT_MAX - Maximum tilt angle in radians for ring variation */
const RING_TILT_MAX = 0.35;

/** @constant {number} DEFAULT_ICY_DISPLACEMENT - Default icy core displacement amplitude */
const DEFAULT_ICY_DISPLACEMENT = 1.2;

/** @constant {number} DEFAULT_RING_NOISE_SCALE - Noise frequency for ring surface detail */
const DEFAULT_RING_NOISE_SCALE = 0.8;

/** @constant {number} DEFAULT_RING_DISPLACEMENT - Default ring surface displacement amplitude */
const DEFAULT_RING_DISPLACEMENT = 0.25;

/**
 * Renders a ring world as a frozen core sphere surrounded by independently
 * spinning rings at different radii and tilt angles. When `icyCore` is set,
 * the core uses noise-displaced icy surface shaders.
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

  /** @property {ShaderMaterial | null} coreMaterial - Icy core shader material (null if not icy) */
  private coreMaterial: ShaderMaterial | null = null;

  /** @property {Mesh | null} coreMesh - Core sphere mesh for LOD swapping */
  private coreMesh: Mesh | null = null;

  /** @property {SphereLODSet | null} coreLOD - Core geometry LOD set (icy cores only) */
  private coreLOD: SphereLODSet | null = null;

  /** @property {SphereLODSet | null} coreBasicLOD - Core geometry LOD set (non-icy cores) */
  private coreBasicLOD: SphereLODSet | null = null;

  /** @property {ShaderMaterial[]} ringMaterials - Shader materials for noise-textured rings */
  private ringMaterials: ShaderMaterial[] = [];

  /** @property {RenderQualityLevel} qualityLevel - Current adaptive quality level */
  private qualityLevel: RenderQualityLevel = 'high';

  /**
   * Apply adaptive quality level to ring/core shader detail.
   *
   * @param {RenderQualityLevel} level - New quality level
   */
  setQualityLevel(level: RenderQualityLevel): void {
    this.qualityLevel = level;

    if (this.coreMesh) {
      const lodSet = this.coreLOD ?? this.coreBasicLOD;
      if (lodSet) {
        this.coreMesh.geometry = lodSet[level];
      }
    }

    const maxRings = MAX_VISIBLE_RINGS[level];
    for (let i = 0; i < this.ringPivots.length; i++) {
      this.ringPivots[i].visible = i < maxRings;
    }
  }

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
    const coreColor = extractColor(
      config as unknown as Record<string, unknown>,
      'coreColor',
      '#c8dde8',
    );
    const ringColor = extractColor(
      config as unknown as Record<string, unknown>,
      'ringColor',
      '#9ab8d0',
    );
    this.ringCount = (config.ringCount as number) ?? DEFAULT_RING_COUNT;
    this.baseRotationSpeed =
      (config.rotationSpeed as number) ?? DEFAULT_BASE_ROTATION_SPEED;

    const coreRadius =
      (config.coreRadius as number) ?? data.radius * DEFAULT_CORE_RADIUS_RATIO;
    const ringSpacing = (config.ringSpacing as number) ?? DEFAULT_RING_SPACING;
    const tubeRadius =
      (config.ringTubeRadius as number) ?? DEFAULT_RING_TUBE_RADIUS;

    const coreGeometry = config.icyCore
      ? (() => {
          this.coreLOD = createSphereLODSet(coreRadius, ICY_CORE_LOD);
          return this.coreLOD[this.qualityLevel];
        })()
      : (() => {
          this.coreBasicLOD = createSphereLODSet(coreRadius, {
            high: 16,
            medium: 12,
            low: 8,
          });
          return this.coreBasicLOD[this.qualityLevel];
        })();

    let coreMesh: Mesh;

    if (config.icyCore) {
      this.coreMaterial = createDisplacedShaderMaterial({
        vertexShader: icyCoreVert,
        fragmentShader: icyCoreFrag,
        uniforms: {
          uTime: { value: 0 },
          uDisplacementScale: { value: DEFAULT_ICY_DISPLACEMENT },
          uDeepColor: { value: new Color('#1a3a6c') },
          uIceColor: { value: new Color(coreColor) },
          uFrostColor: { value: new Color('#e8f4ff') },
          uLightDir: { value: new Vector3(1, 0.5, 0.5).normalize() },
          uAmbient: { value: 0.3 },
        },
      });
      coreMesh = new Mesh(coreGeometry, this.coreMaterial);
    } else {
      const coreMaterial = new MeshPhongMaterial({
        color: coreColor,
        emissive: coreColor,
        emissiveIntensity: 0.35,
        shininess: 80,
      });
      coreMesh = new Mesh(coreGeometry, coreMaterial);
    }

    coreMesh.name = 'ring-core';
    coreMesh.frustumCulled = false;
    this.coreMesh = coreMesh;
    group.add(coreMesh);

    const startRadius = coreRadius + ringSpacing * 1.5;

    for (let i = 0; i < this.ringCount; i++) {
      const ringRadius = startRadius + i * ringSpacing;
      const shade = 0.7 + (i / this.ringCount) * 0.3;

      const torusGeometry = new TorusGeometry(
        ringRadius,
        tubeRadius,
        TORUS_RADIAL_SEGMENTS,
        TORUS_TUBULAR_SEGMENTS,
      );

      const ringMat = createDisplacedShaderMaterial({
        vertexShader: ringWorldVert,
        fragmentShader: ringWorldFrag,
        uniforms: {
          uTime: { value: 0 },
          uNoiseScale: { value: DEFAULT_RING_NOISE_SCALE },
          uDisplacementScale: { value: DEFAULT_RING_DISPLACEMENT },
          uBaseColor: { value: ringColor.clone().multiplyScalar(shade) },
          uVeinColor: {
            value: new Color(coreColor)
              .lerp(ringColor, 0.5)
              .multiplyScalar(1.2),
          },
          uLightDir: { value: new Vector3(1, 0.5, 0.5).normalize() },
          uAmbient: { value: 0.3 },
        },
        materialParams: { side: DoubleSide },
      });

      this.ringMaterials.push(ringMat);

      const ringPivot = new Object3D();
      ringPivot.name = `ring-pivot-${i}`;

      const ring = new Mesh(torusGeometry, ringMat);
      ring.name = `ring-${i}`;
      ring.frustumCulled = false;
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

    this.setQualityLevel(this.qualityLevel);

    return group;
  }

  /**
   * Spin each ring at a different speed and update icy core shader each frame.
   *
   * @param {Object3D} mesh - The ring world group
   * @param {number} _time - Elapsed time
   * @param {number} deltaTime - Frame delta
   * @param {SceneContext} _ctx - Scene context
   */
  update(
    mesh: Object3D,
    _time: number,
    deltaTime: number,
    _ctx: SceneContext,
  ): void {
    if (this.coreMaterial) {
      this.coreMaterial.uniforms.uTime.value = _time;
    }

    for (const mat of this.ringMaterials) {
      mat.uniforms.uTime.value = _time;
    }

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
    disposeSphereLODSet(this.coreLOD);
    disposeSphereLODSet(this.coreBasicLOD);
    this.coreLOD = null;
    this.coreBasicLOD = null;
    this.coreMesh = null;
  }
}
