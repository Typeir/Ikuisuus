/**
 * @fileoverview Gas Giant Renderer — Multi-Layer Cloud Sphere with Storm Effects
 * @description Renders gas giant bodies (Länsihenkï, Itähenkï) with procedural
 * cloud bands computed entirely in the fragment shader using world-space noise
 * sampling. Two concentric spheres create parallax depth: an opaque base layer
 * with broad bands, and a transparent swirl overlay with finer cloud detail.
 * This Everdark-style approach avoids vertex displacement, eliminating jitter
 * artefacts at large viewing distances.
 *
 * @module worldSim/celestials/GasGiantRenderer
 * @version 3.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
    AdditiveBlending,
    Color,
    Mesh,
    Object3D,
    ShaderMaterial,
    SphereGeometry,
    Sprite,
    SpriteMaterial,
    Vector3,
} from 'three';
import type { RenderQualityLevel } from '../optimization/AdaptivePerformanceController';
import {
    GAS_GIANT_LOD,
    type SphereLODSet,
} from '../optimization/GeometryBudgets';
import gasGiantFrag from '../shaders/gasGiant.frag.glsl';
import gasGiantVert from '../shaders/gasGiant.vert.glsl';
import noise3d from '../shaders/noise3d.glsl';
import {
    createCelestialGlow,
    createRadialGradientTexture,
} from './CelestialGlow';
import { disposeSceneGraph } from './disposeUtils';
import type {
    BoundaryData,
    CelestialBodyData,
    GasGiantRenderConfig,
    ICelestialRenderer,
    SceneContext,
} from './interfaces';

/** @constant {number} DEFAULT_ROTATION_SPEED - Default axial rotation speed */
const DEFAULT_ROTATION_SPEED = 0.02;

/** @constant {number} HAZE_SCALE - Scale multiplier for atmospheric haze sprite */
const HAZE_SCALE = 2.5;

/** @constant {number} STORM_SPEED - Speed of storm opacity animation */
const STORM_SPEED = 0.3;

/** @constant {number} HAZE_TEXTURE_SIZE - Resolution of the procedural haze texture */
const HAZE_TEXTURE_SIZE = 256;

/** @constant {number} DEFAULT_BAND_FREQUENCY - Default vertical frequency for cloud bands */
const DEFAULT_BAND_FREQUENCY = 3.0;

/** @constant {number} DEFAULT_TIME_SCALE - Default time scale for cloud animation speed */
const DEFAULT_TIME_SCALE = 0.08;

/** @constant {Record<RenderQualityLevel, number>} QUALITY_TO_DETAIL - Quality-to-shader detail mapping */
const QUALITY_TO_DETAIL: Record<RenderQualityLevel, number> = {
  high: 2,
  medium: 1,
  low: 0,
};

/**
 * Gradient stops for the gas giant atmospheric haze texture.
 * Softer center with faster falloff than star corona.
 * @constant {import('./CelestialGlow').GradientStop[]}
 */
const HAZE_GLOW_STOPS = [
  { offset: 0, color: 'rgba(255, 255, 255, 0.6)' },
  { offset: 0.3, color: 'rgba(255, 255, 255, 0.3)' },
  { offset: 0.6, color: 'rgba(255, 255, 255, 0.1)' },
  { offset: 1.0, color: 'rgba(255, 255, 255, 0.0)' },
];

/**
 * Configuration for a single concentric cloud layer in the gas giant atmosphere.
 * Outer layer is opaque with broad bands; inner layer is translucent with
 * finer detail, creating parallax depth like the Everdark renderer.
 *
 * @interface CloudLayerConfig
 * @property {number} radiusScale - Shell radius as fraction of body radius
 * @property {number} opacity - Base alpha for this layer
 * @property {number} bandFrequencyMultiplier - Multiplier on the body's band frequency
 * @property {number} timeScaleMultiplier - Multiplier on animation speed for parallax drift
 * @property {number} noiseOffset - Spatial offset to de-correlate layers
 * @property {number} segments - Sphere geometry segments for this layer
 * @property {boolean} opaque - Whether this is the outermost opaque layer
 */
interface CloudLayerConfig {
  /** @property {number} radiusScale - Shell radius fraction */
  radiusScale: number;
  /** @property {number} opacity - Base layer opacity */
  opacity: number;
  /** @property {number} bandFrequencyMultiplier - Band frequency scale */
  bandFrequencyMultiplier: number;
  /** @property {number} timeScaleMultiplier - Animation speed scale */
  timeScaleMultiplier: number;
  /** @property {number} noiseOffset - Spatial offset to de-correlate from other layers */
  noiseOffset: number;
  /** @property {number} segments - Geometry segment count */
  segments: number;
  /** @property {boolean} opaque - Outermost opaque layer flag */
  opaque: boolean;
}

/**
 * Cloud layer definitions from outermost to innermost.
 * Base layer provides the dominant cloud band silhouette; swirl overlay
 * adds finer detail at a different drift speed for parallax.
 *
 * @constant {CloudLayerConfig[]}
 */
const CLOUD_LAYER_CONFIGS: CloudLayerConfig[] = [
  {
    radiusScale: 1.0,
    opacity: 1.0,
    bandFrequencyMultiplier: 1.0,
    timeScaleMultiplier: 1.0,
    noiseOffset: 0,
    segments: 48,
    opaque: true,
  },
  {
    radiusScale: 1.05,
    opacity: 0.35,
    bandFrequencyMultiplier: 1.6,
    timeScaleMultiplier: 1.4,
    noiseOffset: 400,
    segments: 32,
    opaque: false,
  },
];

/**
 * Renders gas giant celestial bodies with layered fragment-based cloud bands
 * and atmospheric haze. Cloud noise is computed entirely in the fragment shader
 * using world-space coordinates, avoiding vertex displacement jitter.
 *
 * @class GasGiantRenderer
 * @implements {ICelestialRenderer}
 */
export class GasGiantRenderer implements ICelestialRenderer {
  /** @property {number} rotationSpeed - Axial rotation speed in rad/s */
  private rotationSpeed: number = DEFAULT_ROTATION_SPEED;

  /** @property {Sprite | null} hazeSprite - Atmospheric haze sprite */
  private hazeSprite: Sprite | null = null;

  /** @property {Mesh | null} bodyMesh - Stored reference to the outermost cloud layer mesh */
  private bodyMesh: Mesh | null = null;

  /** @property {ShaderMaterial | null} bodyMaterial - Outermost cloud band shader material */
  private bodyMaterial: ShaderMaterial | null = null;

  /** @property {ShaderMaterial[]} layerMaterials - All cloud layer materials for time updates */
  private layerMaterials: ShaderMaterial[] = [];

  /** @property {Mesh[]} layerMeshes - All cloud layer meshes for LOD swapping */
  private layerMeshes: Mesh[] = [];

  /** @property {SphereLODSet[]} layerLOD - Per-layer LOD geometry sets */
  private layerLOD: SphereLODSet[] = [];

  /** @property {RenderQualityLevel} qualityLevel - Current adaptive quality level */
  private qualityLevel: RenderQualityLevel = 'high';

  /**
   * Apply adaptive quality level to cloud shader detail and secondary effects.
   *
   * @param {RenderQualityLevel} level - New quality level
   */
  setQualityLevel(level: RenderQualityLevel): void {
    this.qualityLevel = level;

    for (const mat of this.layerMaterials) {
      mat.uniforms.uDetailLevel.value = QUALITY_TO_DETAIL[level];
    }

    for (let i = 0; i < this.layerMeshes.length; i++) {
      const mesh = this.layerMeshes[i];
      const lod = this.layerLOD[i];
      if (mesh && lod) {
        mesh.geometry = lod[level];
      }
      if (i > 0) {
        mesh.visible = level !== 'low';
      }
    }

    if (this.hazeSprite) {
      this.hazeSprite.visible = level !== 'low';
    }
  }

  /**
   * Create a gas giant mesh with two concentric cloud shells and haze sprite.
   * The opaque base layer carries the main band pattern; a slightly larger
   * transparent overlay drifts at a different speed for parallax depth.
   *
   * @param {CelestialBodyData | BoundaryData} data - Body definition data
   * @returns {Object3D} Group containing the gas giant layers and haze
   */
  createMesh(data: CelestialBodyData | BoundaryData): Object3D {
    const group = new Object3D();
    group.name = `gasGiant-${data.id}`;

    const config = data.renderConfig as GasGiantRenderConfig;
    const bandColor1 = new Color((config.baseColor as string) ?? '#cc8844');
    const bandColor2 = new Color((config.bandColor as string) ?? '#aa6633');
    const stormColor = new Color((config.stormColor as string) ?? '#ffffff');
    this.rotationSpeed =
      (config.rotationSpeed as number) ?? DEFAULT_ROTATION_SPEED;

    const baseBandFrequency =
      (config.bandFrequency as number) ?? DEFAULT_BAND_FREQUENCY;
    const timeScale = (config.timeScale as number) ?? DEFAULT_TIME_SCALE;

    for (let i = 0; i < CLOUD_LAYER_CONFIGS.length; i++) {
      const layer = CLOUD_LAYER_CONFIGS[i];
      const isBase = i === 0;
      const segTable = isBase ? GAS_GIANT_LOD : GAS_GIANT_LOD;
      const lodSet: SphereLODSet = {
        high: new SphereGeometry(
          data.radius * layer.radiusScale,
          isBase ? segTable.high.base : segTable.high.overlay,
          isBase ? segTable.high.base : segTable.high.overlay,
        ),
        medium: new SphereGeometry(
          data.radius * layer.radiusScale,
          isBase ? segTable.medium.base : segTable.medium.overlay,
          isBase ? segTable.medium.base : segTable.medium.overlay,
        ),
        low: new SphereGeometry(
          data.radius * layer.radiusScale,
          isBase ? segTable.low.base : segTable.low.overlay,
          isBase ? segTable.low.base : segTable.low.overlay,
        ),
      };
      this.layerLOD.push(lodSet);
      const geometry = lodSet[this.qualityLevel];

      const material = new ShaderMaterial({
        vertexShader: noise3d + '\n' + gasGiantVert,
        fragmentShader: noise3d + '\n' + gasGiantFrag,
        uniforms: {
          uTime: { value: 0 },
          uBandFrequency: {
            value: baseBandFrequency * layer.bandFrequencyMultiplier,
          },
          uTimeScale: { value: timeScale * layer.timeScaleMultiplier },
          uLayerOpacity: { value: layer.opacity },
          uNoiseOffset: { value: layer.noiseOffset },
          uDetailLevel: { value: QUALITY_TO_DETAIL[this.qualityLevel] },
          uBandColor1: { value: bandColor1.clone() },
          uBandColor2: { value: bandColor2.clone() },
          uStormColor: { value: stormColor.clone() },
          uLightDir: { value: new Vector3(1, 0.5, 0.5).normalize() },
          uAmbient: { value: 0.3 },
        },
        transparent: !layer.opaque,
        depthWrite: layer.opaque,
        ...(layer.opaque
          ? {
              polygonOffset: true,
              polygonOffsetFactor: 1,
              polygonOffsetUnits: 1,
            }
          : { blending: AdditiveBlending }),
      });

      const shell = new Mesh(geometry, material);
      shell.name = `gasGiant-cloud-${i}`;
      shell.frustumCulled = true;
      group.add(shell);
      this.layerMaterials.push(material);
      this.layerMeshes.push(shell);

      if (i === 0) {
        this.bodyMesh = shell;
        this.bodyMaterial = material;
      }
    }

    const hazeColor = new Color(
      (config.atmosphereColor as string) ?? '#ffddaa',
    );
    const hazeMaterial = new SpriteMaterial({
      map: createRadialGradientTexture(HAZE_TEXTURE_SIZE, HAZE_GLOW_STOPS),
      color: hazeColor,
      transparent: true,
      opacity: 0.15,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    this.hazeSprite = new Sprite(hazeMaterial);
    this.hazeSprite.scale.setScalar(data.radius * HAZE_SCALE);
    this.hazeSprite.name = 'gasGiant-haze';
    this.hazeSprite.frustumCulled = true;
    group.add(this.hazeSprite);

    const glowColor = (config.atmosphereColor as string) ?? '#ffddaa';
    const glow = createCelestialGlow(data.radius, glowColor, 7.0, 0.35);
    group.add(glow);

    this.setQualityLevel(this.qualityLevel);

    return group;
  }

  /**
   * Rotate the gas giant, update cloud band time uniforms on all layers,
   * and animate storm haze.
   *
   * @param {Object3D} mesh - The gas giant group
   * @param {number} time - Elapsed time in seconds
   * @param {number} deltaTime - Frame delta
   * @param {SceneContext} _ctx - Scene context
   */
  update(
    mesh: Object3D,
    time: number,
    deltaTime: number,
    _ctx: SceneContext,
  ): void {
    if (this.bodyMesh) {
      this.bodyMesh.rotation.y += this.rotationSpeed * deltaTime;
    }

    for (const mat of this.layerMaterials) {
      mat.uniforms.uTime.value = time;
    }

    if (this.hazeSprite && this.hazeSprite.visible) {
      const material = this.hazeSprite.material as SpriteMaterial;
      material.opacity = 0.12 + Math.sin(time * STORM_SPEED) * 0.05;
    }
  }

  /**
   * Dispose of gas giant resources.
   *
   * @param {Object3D} mesh - The gas giant group
   */
  dispose(mesh: Object3D): void {
    disposeSceneGraph(mesh);
    this.layerMaterials = [];
    this.layerMeshes = [];
    for (const lodSet of this.layerLOD) {
      lodSet.high.dispose();
      lodSet.medium.dispose();
      lodSet.low.dispose();
    }
    this.layerLOD = [];
    this.hazeSprite = null;
    this.bodyMesh = null;
    this.bodyMaterial = null;
  }
}
