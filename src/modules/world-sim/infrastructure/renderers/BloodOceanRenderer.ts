/**
 * @fileoverview Blood Ocean Renderer — Two-Shell Translucent Blood World
 * @description Renders a dark opaque core sphere visible through a
 * semi-transparent blood ocean shell displaced by bloodOcean.vert.glsl and
 * coloured by bloodOcean.frag.glsl, plus a corona atmosphere and glow sprite.
 *
 * Layer order (back to front):
 * 1. Dark core sphere — opaque, depthWrite true
 * 2. Blood ocean shell — semi-transparent, depthWrite false
 * 3. Corona atmosphere — BackSide AdditiveBlending, depthWrite false
 * 4. Glow sprite — outer far glow, AdditiveBlending
 *
 * @module modules/world-sim/infrastructure/renderers/BloodOceanRenderer
 * @version 1.0.0
 * @author Typeir
 * @since 2026-05-21
 */

import {
    AdditiveBlending,
    BackSide,
    Color,
    Mesh,
    MeshStandardMaterial,
    Object3D,
    ShaderMaterial,
    Vector3,
} from 'three';
import type { RenderQualityLevel } from '@/modules/world-sim/application/services/AdaptivePerformanceController';
import {
    ATMOSPHERE_LOD,
    createSphereLODSet,
    disposeSphereLODSet,
    type SphereLODSet,
} from '@/modules/world-sim/infrastructure/geometry/budgets/GeometryBudgets';
import atmosphereFrag from '../../shaders/atmosphere.frag.glsl';
import atmosphereVert from '../../shaders/atmosphere.vert.glsl';
import bloodOceanFrag from '../../shaders/bloodOcean.frag.glsl';
import bloodOceanVert from '../../shaders/bloodOcean.vert.glsl';
import { createCelestialGlow } from '@/modules/world-sim/infrastructure/effects/CelestialGlow';
import { disposeSceneGraph } from '@/modules/world-sim/infrastructure/geometry/disposeUtils';
import type {
    BloodOceanRenderConfig,
    BoundaryData,
    CelestialBodyData,
    ICelestialRenderer,
    SceneContext,
} from '@/modules/world-sim/domain/celestials/celestialBody.types';
import { createDisplacedShaderMaterial } from '@/modules/world-sim/infrastructure/renderers/shaderMaterialFactory';

/** @constant {number} DEFAULT_ROTATION_SPEED - Default axial rotation speed (rad/s) */
const DEFAULT_ROTATION_SPEED = 0.0007;

/** @constant {number} DEFAULT_DISPLACEMENT_SCALE - Default vertex displacement amplitude */
const DEFAULT_DISPLACEMENT_SCALE = 2.0;

/** @constant {number} DEFAULT_NOISE_SCALE - Default noise frequency for the ocean surface */
const DEFAULT_NOISE_SCALE = 0.055;

/** @constant {number} DEFAULT_TIME_SCALE - Default animation speed multiplier */
const DEFAULT_TIME_SCALE = 0.15;

/** @constant {number} DEFAULT_NOISE_SEED - Default body-unique noise seed */
const DEFAULT_NOISE_SEED = 73;

/** @constant {number} DEFAULT_CORE_RADIUS_RATIO - Core sphere radius as fraction of body radius */
const DEFAULT_CORE_RADIUS_RATIO = 0.72;

/** @constant {number} DEFAULT_OCEAN_ALPHA - Default blood shell transparency */
const DEFAULT_OCEAN_ALPHA = 0.62;

/** @constant {number} CORONA_SCALE - Corona shell radius as fraction of body radius */
const CORONA_SCALE = 1.12;

/** @constant {number} CORONA_INTENSITY - Rim light intensity for the corona atmosphere */
const CORONA_INTENSITY = 2.2;

/**
 * Renders the blood ocean world: an opaque dark core and a semi-transparent
 * vertex-displaced ocean shell.
 *
 * @class BloodOceanRenderer
 * @implements {ICelestialRenderer}
 */
export class BloodOceanRenderer implements ICelestialRenderer {
  /** @property {number} rotationSpeed - Axial rotation speed in rad/s */
  private rotationSpeed: number = DEFAULT_ROTATION_SPEED;

  /** @property {Mesh | null} coreMesh - Opaque dark core sphere */
  private coreMesh: Mesh | null = null;

  /** @property {Mesh | null} oceanMesh - Semi-transparent blood ocean shell */
  private oceanMesh: Mesh | null = null;

  /** @property {ShaderMaterial | null} oceanMaterial - Blood ocean shader material */
  private oceanMaterial: ShaderMaterial | null = null;

  /** @property {Mesh | null} coronaMesh - Corona atmosphere shell */
  private coronaMesh: Mesh | null = null;

  /** @property {SphereLODSet | null} oceanLOD - Ocean shell geometry LOD set */
  private oceanLOD: SphereLODSet | null = null;

  /** @property {SphereLODSet | null} coreLOD - Core sphere geometry LOD set */
  private coreLOD: SphereLODSet | null = null;

  /** @property {SphereLODSet | null} coronaLOD - Corona shell geometry LOD set */
  private coronaLOD: SphereLODSet | null = null;

  /** @property {RenderQualityLevel} qualityLevel - Current adaptive quality level */
  private qualityLevel: RenderQualityLevel = 'high';

  /**
   * Swap LOD geometries to the given quality level and hide the corona at 'low'.
   *
   * @param {RenderQualityLevel} level - New quality level
   */
  setQualityLevel(level: RenderQualityLevel): void {
    this.qualityLevel = level;

    if (this.coreMesh && this.coreLOD) {
      this.coreMesh.geometry = this.coreLOD[level];
    }
    if (this.oceanMesh && this.oceanLOD) {
      this.oceanMesh.geometry = this.oceanLOD[level];
    }
    if (this.coronaMesh) {
      this.coronaMesh.visible = level !== 'low';
      if (this.coronaLOD) {
        this.coronaMesh.geometry = this.coronaLOD[level];
      }
    }
  }

  /**
   * Create the blood ocean world mesh group.
   * Layers: dark core → displaced ocean shell → corona → glow sprite.
   *
   * @param {CelestialBodyData | BoundaryData} data - Body definition data
   * @returns {Object3D} Group containing all blood ocean layers
   */
  createMesh(data: CelestialBodyData | BoundaryData): Object3D {
    const group = new Object3D();
    group.name = `bloodOcean-${data.id}`;

    const config = data.renderConfig as BloodOceanRenderConfig;
    this.rotationSpeed = config.rotationSpeed ?? DEFAULT_ROTATION_SPEED;

    const coreRadiusRatio = config.coreRadiusRatio ?? DEFAULT_CORE_RADIUS_RATIO;
    const coreRadius = data.radius * coreRadiusRatio;

    /* --- Layer 1: Dark opaque core --- */
    this.coreLOD = createSphereLODSet(coreRadius);
    const coreMaterial = new MeshStandardMaterial({
      color: new Color(config.coreColor ?? '#0d0002'),
      roughness: 1.0,
      metalness: 0.0,
    });
    this.coreMesh = new Mesh(this.coreLOD[this.qualityLevel], coreMaterial);
    this.coreMesh.name = 'bloodOcean-core';
    this.coreMesh.frustumCulled = false;
    group.add(this.coreMesh);

    /* --- Layer 2: Semi-transparent blood ocean shell --- */
    this.oceanLOD = createSphereLODSet(data.radius);
    this.oceanMaterial = createDisplacedShaderMaterial({
      vertexShader: bloodOceanVert,
      fragmentShader: bloodOceanFrag,
      uniforms: {
        uTime: { value: 0 },
        uDisplacementScale: {
          value: config.displacementScale ?? DEFAULT_DISPLACEMENT_SCALE,
        },
        uNoiseScale: { value: config.noiseScale ?? DEFAULT_NOISE_SCALE },
        uNoiseSeed: { value: config.noiseSeed ?? DEFAULT_NOISE_SEED },
        uTimeScale: { value: config.timeScale ?? DEFAULT_TIME_SCALE },
        uOceanColor: {
          value: new Color(config.oceanColor ?? '#5c0005'),
        },
        uOceanHighlight: {
          value: new Color(config.oceanHighlightColor ?? '#8b1515'),
        },
        uOceanAlpha: { value: config.oceanAlpha ?? DEFAULT_OCEAN_ALPHA },
        uLightDir: { value: new Vector3(1, 0.5, 0.5).normalize() },
        uAmbient: { value: 0.25 },
      },
      materialParams: {
        transparent: true,
        depthWrite: false,
      },
    });
    this.oceanMesh = new Mesh(
      this.oceanLOD[this.qualityLevel],
      this.oceanMaterial,
    );
    this.oceanMesh.name = 'bloodOcean-shell';
    this.oceanMesh.frustumCulled = false;
    group.add(this.oceanMesh);

    /* --- Layer 3: Corona atmosphere shell (reuses atmosphere shaders) --- */
    const coronaColor = new Color(config.coronaColor ?? '#660000');
    this.coronaLOD = createSphereLODSet(
      data.radius * CORONA_SCALE,
      ATMOSPHERE_LOD,
    );
    const coronaMaterial = new ShaderMaterial({
      vertexShader: atmosphereVert,
      fragmentShader: atmosphereFrag,
      uniforms: {
        uColor: { value: coronaColor },
        uIntensity: { value: CORONA_INTENSITY },
      },
      transparent: true,
      blending: AdditiveBlending,
      side: BackSide,
      depthWrite: false,
    });
    this.coronaMesh = new Mesh(
      this.coronaLOD[this.qualityLevel],
      coronaMaterial,
    );
    this.coronaMesh.name = 'bloodOcean-corona';
    this.coronaMesh.frustumCulled = true;
    group.add(this.coronaMesh);

    /* --- Layer 4: Outer glow sprite --- */
    const glowColor = config.coronaColor ?? '#660000';
    const glow = createCelestialGlow(data.radius, glowColor);
    group.add(glow);

    this.setQualityLevel(this.qualityLevel);

    return group;
  }

  /**
   * Rotate the ocean shell on its axis and advance the noise time uniform.
   *
   * @param {Object3D} _mesh - The blood ocean group (unused — meshes stored internally)
   * @param {number} time - Elapsed time in seconds
   * @param {number} deltaTime - Frame delta in seconds
   * @param {SceneContext} _ctx - Scene context (unused)
   */
  update(
    _mesh: Object3D,
    time: number,
    deltaTime: number,
    _ctx: SceneContext,
  ): void {
    if (this.oceanMesh) {
      this.oceanMesh.rotation.y += this.rotationSpeed * deltaTime;
    }
    if (this.oceanMaterial) {
      this.oceanMaterial.uniforms.uTime.value = time;
    }
  }

  /**
   * Dispose of all GPU resources for the blood ocean world.
   *
   * @param {Object3D} mesh - The blood ocean group
   */
  dispose(mesh: Object3D): void {
    disposeSceneGraph(mesh);
    this.coreMesh = null;
    this.oceanMesh = null;
    this.oceanMaterial = null;
    this.coronaMesh = null;
    disposeSphereLODSet(this.coreLOD);
    disposeSphereLODSet(this.oceanLOD);
    disposeSphereLODSet(this.coronaLOD);
    this.coreLOD = null;
    this.oceanLOD = null;
    this.coronaLOD = null;
  }
}
