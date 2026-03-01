/**
 * @fileoverview Planet Renderer — Terrain-Displaced Sphere with Surface Features
 * @description Renders terrestrial planets with procedural noise-driven vertex
 * displacement and a 5-band terrain colour ramp. The same noise mask drives
 * both geometry displacement and colour interpolation so terrain features
 * (oceans, grasslands, mountains, snow) align naturally.
 *
 * @module worldSim/celestials/PlanetRenderer
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
    AdditiveBlending,
    BackSide,
    Color,
    Mesh,
    Object3D,
    ShaderMaterial,
    SphereGeometry,
    Vector3,
} from 'three';
import atmosphereFrag from '../shaders/atmosphere.frag.glsl';
import atmosphereVert from '../shaders/atmosphere.vert.glsl';
import noise3d from '../shaders/noise3d.glsl';
import planetFrag from '../shaders/planet.frag.glsl';
import planetVert from '../shaders/planet.vert.glsl';
import type { RenderQualityLevel } from '../optimization/AdaptivePerformanceController';
import {
    ATMOSPHERE_LOD,
    createSphereLODSet,
    disposeSphereLODSet,
    type SphereLODSet,
} from '../optimization/GeometryBudgets';
import { createCelestialGlow } from './CelestialGlow';
import { disposeSceneGraph } from './disposeUtils';
import type {
    BoundaryData,
    CelestialBodyData,
    ICelestialRenderer,
    PlanetRenderConfig,
    SceneContext,
    TerrainColorStop,
} from './interfaces';

/** @constant {number} DEFAULT_ROTATION_SPEED - Default planet axial rotation (radians/sec) */
const DEFAULT_ROTATION_SPEED = 0.05;

/** @constant {number} ATMOSPHERE_SCALE - Scale of atmosphere shell relative to planet radius */
const ATMOSPHERE_SCALE = 1.08;

/** @constant {number} DEFAULT_DISPLACEMENT_SCALE - Default terrain displacement amplitude */
const DEFAULT_DISPLACEMENT_SCALE = 1.5;

/** @constant {number} DEFAULT_CONTINENT_SCALE - Default continent layer noise frequency */
const DEFAULT_CONTINENT_SCALE = 0.03;

/** @constant {number} DEFAULT_DETAIL_SCALE - Default detail layer noise frequency */
const DEFAULT_DETAIL_SCALE = 0.12;

/** @constant {number} DEFAULT_OCEAN_THRESHOLD - Default ocean floor clamp value */
const DEFAULT_OCEAN_THRESHOLD = -0.15;

/** @constant {number} DEFAULT_NOISE_SEED - Default noise seed */
const DEFAULT_NOISE_SEED = 0;

/** @constant {number} DEFAULT_POLAR_LATITUDE - Default polar ice start as normal.y threshold */
const DEFAULT_POLAR_LATITUDE = 0.75;

/** @constant {Record<RenderQualityLevel, number>} QUALITY_TO_DETAIL - Quality-to-shader detail mapping */
const QUALITY_TO_DETAIL: Record<RenderQualityLevel, number> = {
  high: 2,
  medium: 1,
  low: 0,
};

/**
 * Default terrain colour stops: ocean → lowland → highlands → mountains → peaks.
 * @constant {TerrainColorStop[]}
 */
const DEFAULT_TERRAIN_COLORS: TerrainColorStop[] = [
  { color: '#2244aa', threshold: 0.3 },
  { color: '#44aa44', threshold: 0.45 },
  { color: '#888844', threshold: 0.6 },
  { color: '#aa8866', threshold: 0.78 },
  { color: '#ffffff', threshold: 1.0 },
];

/**
 * Renders terrestrial planet bodies with noise-displaced terrain and
 * 5-band elevation colour ramp, plus optional atmosphere.
 *
 * @class PlanetRenderer
 * @implements {ICelestialRenderer}
 */
export class PlanetRenderer implements ICelestialRenderer {
  /** @property {number} rotationSpeed - Axial rotation speed in rad/s */
  private rotationSpeed: number = DEFAULT_ROTATION_SPEED;

  /** @property {Mesh | null} surfaceMesh - Stored reference to the planet surface mesh */
  private surfaceMesh: Mesh | null = null;

  /** @property {ShaderMaterial | null} surfaceMaterial - Terrain shader material */
  private surfaceMaterial: ShaderMaterial | null = null;

  /** @property {Mesh | null} atmosphereMesh - Optional atmosphere shell mesh */
  private atmosphereMesh: Mesh | null = null;

  /** @property {SphereLODSet | null} surfaceLOD - Surface geometry LOD set */
  private surfaceLOD: SphereLODSet | null = null;

  /** @property {SphereLODSet | null} atmosphereLOD - Atmosphere geometry LOD set */
  private atmosphereLOD: SphereLODSet | null = null;

  /** @property {RenderQualityLevel} qualityLevel - Current adaptive quality level */
  private qualityLevel: RenderQualityLevel = 'high';

  /**
   * Apply adaptive quality level to terrain shader detail and secondary effects.
   *
   * @param {RenderQualityLevel} level - New quality level
   */
  setQualityLevel(level: RenderQualityLevel): void {
    this.qualityLevel = level;

    if (this.surfaceMaterial) {
      this.surfaceMaterial.uniforms.uDetailLevel.value =
        QUALITY_TO_DETAIL[level];
    }

    if (this.surfaceMesh && this.surfaceLOD) {
      this.surfaceMesh.geometry = this.surfaceLOD[level];
    }

    if (this.atmosphereMesh) {
      this.atmosphereMesh.visible = level !== 'low';
      if (this.atmosphereLOD) {
        this.atmosphereMesh.geometry = this.atmosphereLOD[level];
      }
    }
  }

  /**
   * Create a planet mesh with terrain displacement and optional atmosphere shell.
   *
   * @param {CelestialBodyData | BoundaryData} data - Body definition data
   * @returns {Object3D} Group containing the planet and optional atmosphere
   */
  createMesh(data: CelestialBodyData | BoundaryData): Object3D {
    const group = new Object3D();
    group.name = `planet-${data.id}`;

    const config = data.renderConfig as PlanetRenderConfig;
    this.rotationSpeed =
      (config.rotationSpeed as number) ?? DEFAULT_ROTATION_SPEED;

    const terrainColors = config.terrainColors ?? DEFAULT_TERRAIN_COLORS;
    const colors = terrainColors.map((s) => new Color(s.color));

    this.surfaceLOD = createSphereLODSet(data.radius);
    const geometry = this.surfaceLOD[this.qualityLevel];
    const polarIce = config.polarIce ?? false;

    this.surfaceMaterial = new ShaderMaterial({
      vertexShader: noise3d + '\n' + planetVert,
      fragmentShader: planetFrag,
      uniforms: {
        uTime: { value: 0 },
        uDisplacementScale: {
          value:
            (config.displacementScale as number) ?? DEFAULT_DISPLACEMENT_SCALE,
        },
        uContinentScale: {
          value:
            (config.continentScale as number) ?? DEFAULT_CONTINENT_SCALE,
        },
        uDetailScale: {
          value: (config.detailScale as number) ?? DEFAULT_DETAIL_SCALE,
        },
        uOceanThreshold: {
          value:
            (config.oceanThreshold as number) ?? DEFAULT_OCEAN_THRESHOLD,
        },
        uDetailLevel: { value: QUALITY_TO_DETAIL[this.qualityLevel] },
        uSeed: { value: (config.noiseSeed as number) ?? DEFAULT_NOISE_SEED },
        uColor0: { value: colors[0] ?? new Color('#2244aa') },
        uColor1: { value: colors[1] ?? new Color('#44aa44') },
        uColor2: { value: colors[2] ?? new Color('#888844') },
        uColor3: { value: colors[3] ?? new Color('#aa8866') },
        uColor4: { value: colors[4] ?? new Color('#ffffff') },
        uThreshold01: { value: terrainColors[0]?.threshold ?? 0.3 },
        uThreshold12: { value: terrainColors[1]?.threshold ?? 0.45 },
        uThreshold23: { value: terrainColors[2]?.threshold ?? 0.6 },
        uThreshold34: { value: terrainColors[3]?.threshold ?? 0.78 },
        uLightDir: { value: new Vector3(1, 0.5, 0.5).normalize() },
        uAmbient: { value: 0.25 },
        uPolarIce: { value: polarIce ? 1.0 : 0.0 },
        uPolarLatitude: {
          value:
            (config.polarLatitude as number) ?? DEFAULT_POLAR_LATITUDE,
        },
        uIceColor: {
          value: new Color(config.iceColor ?? '#e8f0ff'),
        },
      },
    });

    const planetMesh = new Mesh(geometry, this.surfaceMaterial);
    planetMesh.name = 'planet-surface';
    planetMesh.frustumCulled = true;
    this.surfaceMesh = planetMesh;
    group.add(planetMesh);

    const glowColor =
      (config.atmosphereColor as string) ??
      (config.baseColor as string) ??
      '#4488cc';
    const glow = createCelestialGlow(data.radius, glowColor);
    group.add(glow);

    if (config.atmosphereColor) {
      const atmosphereColor = new Color(config.atmosphereColor as string);
      this.atmosphereLOD = createSphereLODSet(
        data.radius * ATMOSPHERE_SCALE,
        ATMOSPHERE_LOD,
      );
      const atmosphereGeometry = this.atmosphereLOD[this.qualityLevel];
      const atmosphereMaterial = new ShaderMaterial({
        vertexShader: atmosphereVert,
        fragmentShader: atmosphereFrag,
        uniforms: {
          uColor: { value: atmosphereColor },
          uIntensity: {
            value: (config.atmosphereIntensity as number) ?? 1.5,
          },
        },
        transparent: true,
        blending: AdditiveBlending,
        side: BackSide,
        depthWrite: false,
      });

      const atmosphere = new Mesh(atmosphereGeometry, atmosphereMaterial);
      atmosphere.name = 'planet-atmosphere';
      atmosphere.frustumCulled = true;
      this.atmosphereMesh = atmosphere;
      group.add(atmosphere);
    }

    this.setQualityLevel(this.qualityLevel);

    return group;
  }

  /**
   * Rotate the planet on its axis and update the light direction uniform.
   *
   * @param {Object3D} mesh - The planet group
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
    if (this.surfaceMesh) {
      this.surfaceMesh.rotation.y += this.rotationSpeed * deltaTime;
    }
  }

  /**
   * Dispose of planet resources.
   *
   * @param {Object3D} mesh - The planet group
   */
  dispose(mesh: Object3D): void {
    disposeSceneGraph(mesh);
    this.surfaceMesh = null;
    this.surfaceMaterial = null;
    this.atmosphereMesh = null;
    disposeSphereLODSet(this.surfaceLOD);
    disposeSphereLODSet(this.atmosphereLOD);
    this.surfaceLOD = null;
    this.atmosphereLOD = null;
  }
}
