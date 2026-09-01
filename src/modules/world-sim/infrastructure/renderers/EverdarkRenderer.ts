/**
 * @fileoverview Renders the Everdark as concentric inverted spheres with fire shaders.
 * @description Layered noise and opacity; GLSL shaders imported from .glsl files.
 *
 * @module modules/world-sim/infrastructure/renderers/EverdarkRenderer
 * @version 1.2.0
 * @author Typeir
 * @since 1.0.0
 */

import {
    AdditiveBlending,
    BackSide,
    Mesh,
    NormalBlending,
    Object3D,
    ShaderMaterial,
    SphereGeometry,
} from 'three';
import type { RenderQualityLevel } from '@/modules/world-sim/application/services/AdaptivePerformanceController';
import {
    EVERDARK_LOD,
    type SphereLODSet,
} from '@/modules/world-sim/infrastructure/geometry/budgets/GeometryBudgets';
import everdarkFrag from '../../shaders/everdark.frag.glsl';
import everdarkVert from '../../shaders/everdark.vert.glsl';
import { disposeSceneGraph } from '@/modules/world-sim/infrastructure/geometry/disposeUtils';
import type {
    BoundaryData,
    CelestialBodyData,
    ICelestialRenderer,
    SceneContext,
} from '@/modules/world-sim/domain/celestials/celestialBody.types';
import { createDisplacedShaderMaterial } from '@/modules/world-sim/infrastructure/renderers/shaderMaterialFactory';

/**
 * Configuration for a single Everdark shell layer.
 * All values are absolute — no multipliers against a shared base.
 *
 * @interface EverdarkLayerConfig
 * @property {number} radiusScale - Fraction of the boundary radius for this shell
 * @property {number} opacity - Base opacity for this layer (before rim attenuation)
 * @property {number} flameScale - Noise sampling frequency (lower = bigger blotches)
 * @property {number} flameSpeed - Vertical drift speed for flame animation
 * @property {number} jaggedScale - Fine-noise sampling frequency for edge breakup
 * @property {number} jaggedStrength - How much the fine noise displaces edge thresholds
 * @property {number} edgeWidth - Smoothstep width for edge detection bands
 * @property {number} noiseOffset - Spatial offset to de-correlate layers
 * @property {number} segments - Sphere geometry resolution
 */
interface EverdarkLayerConfig {
  /** @property {number} radiusScale - Shell radius as fraction of boundary radius */
  radiusScale: number;
  /** @property {number} opacity - Absolute base opacity for the shader */
  opacity: number;
  /** @property {boolean} opaqueBlack - Use NormalBlending for opaque black body (outer layer only) */
  opaqueBlack: boolean;
  /** @property {number} flameScale - Noise frequency (lower = bigger features) */
  flameScale: number;
  /** @property {number} flameSpeed - Vertical drift speed */
  flameSpeed: number;
  /** @property {number} jaggedScale - Fine-noise frequency for jagged edges */
  jaggedScale: number;
  /** @property {number} jaggedStrength - Edge displacement magnitude */
  jaggedStrength: number;
  /** @property {number} edgeWidth - Width of the smoothstep edge band */
  edgeWidth: number;
  /** @property {number} noiseOffset - Spatial offset for layer de-correlation */
  noiseOffset: number;
  /** @property {number} segments - Sphere geometry segment count */
  segments: number;
}

/**
 * Layer definitions from outermost to innermost.
 *
 * @constant {EverdarkLayerConfig[]}
 */
const LAYER_CONFIGS: EverdarkLayerConfig[] = [
  {
    radiusScale: 1.0,
    opacity: 0.85,
    opaqueBlack: true,
    flameScale: 0.00008,
    flameSpeed: 0.06,
    jaggedScale: 0.002,
    jaggedStrength: 0.12,
    edgeWidth: 0.1,
    noiseOffset: 0,
    segments: 64,
  },
  {
    radiusScale: 0.88,
    opacity: 0.65,
    opaqueBlack: true,
    flameScale: 0.0002,
    flameSpeed: 0.05,
    jaggedScale: 0.006,
    jaggedStrength: 0.22,
    edgeWidth: 0.08,
    noiseOffset: 500,
    segments: 48,
  },
  {
    radiusScale: 0.75,
    opacity: 0.05,
    opaqueBlack: false,
    flameScale: 0.00045,
    flameSpeed: 0.04,
    jaggedScale: 0.012,
    jaggedStrength: 0.35,
    edgeWidth: 0.06,
    noiseOffset: 1200,
    segments: 32,
  },
];

/**
 * Create a ShaderMaterial for one Everdark shell layer.
 *
 * @function createLayerMaterial
 * @param {EverdarkLayerConfig} layer - Layer-specific shader parameters
 * @returns {ShaderMaterial} Configured fire-wall material
 */
function createLayerMaterial(layer: EverdarkLayerConfig): ShaderMaterial {
  return createDisplacedShaderMaterial({
    vertexShader: everdarkVert,
    fragmentShader: everdarkFrag,
    prependNoiseToFragment: true,
    uniforms: {
      uTime: { value: 0 },
      uFlameSpeed: { value: layer.flameSpeed },
      uFlameScale: { value: layer.flameScale },
      uEdgeWidth: { value: layer.edgeWidth },
      uBaseOpacity: { value: layer.opacity },
      uJaggedScale: { value: layer.jaggedScale },
      uJaggedStrength: { value: layer.jaggedStrength },
    },
    materialParams: {
      transparent: true,
      blending: layer.opaqueBlack ? NormalBlending : AdditiveBlending,
      side: BackSide,
      depthWrite: layer.opaqueBlack,
      ...(layer.opaqueBlack
        ? { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }
        : {}),
    },
  });
}

/**
 * Renders the Everdark boundary as multiple concentric inverted spheres with
 * layered fire shaders.
 *
 * @class EverdarkRenderer
 * @implements {ICelestialRenderer}
 */
export class EverdarkRenderer implements ICelestialRenderer {
  /** @property {ShaderMaterial[]} materials - All layer materials for time updates */
  private materials: ShaderMaterial[] = [];

  /** @property {Mesh[]} shells - All layer meshes for LOD geometry swapping */
  private shells: Mesh[] = [];

  /** @property {SphereLODSet[]} shellLOD - Per-layer LOD geometry sets */
  private shellLOD: SphereLODSet[] = [];

  /** @property {RenderQualityLevel} qualityLevel - Current adaptive quality level */
  private qualityLevel: RenderQualityLevel = 'high';

  /**
   * Create the multi-layer Everdark boundary.
   *
   * @param {CelestialBodyData | BoundaryData} data - Boundary definition data
   * @returns {Object3D} Group containing all shell layers
   */
  createMesh(data: CelestialBodyData | BoundaryData): Object3D {
    const group = new Object3D();
    group.name = `everdark-${data.id}`;

    for (let i = 0; i < LAYER_CONFIGS.length; i++) {
      const layer = LAYER_CONFIGS[i];
      const layerRadius = data.radius * layer.radiusScale;
      const lodSet: SphereLODSet = {
        high: new SphereGeometry(
          layerRadius,
          EVERDARK_LOD.high[i] ?? 16,
          EVERDARK_LOD.high[i] ?? 16,
        ),
        medium: new SphereGeometry(
          layerRadius,
          EVERDARK_LOD.medium[i] ?? 8,
          EVERDARK_LOD.medium[i] ?? 8,
        ),
        low: new SphereGeometry(
          layerRadius,
          EVERDARK_LOD.low[i] ?? 8,
          EVERDARK_LOD.low[i] ?? 8,
        ),
      };
      this.shellLOD.push(lodSet);

      const geometry = lodSet[this.qualityLevel];

      const material = createLayerMaterial(layer);

      const shell = new Mesh(geometry, material);
      shell.name = `everdark-shell-${i}`;
      shell.renderOrder = i;

      if (layer.noiseOffset !== 0) {
        shell.position.y = layer.noiseOffset * 0.001;
      }

      group.add(shell);
      this.shells.push(shell);
      this.materials.push(material);
    }

    return group;
  }

  /**
   * Apply adaptive quality level — swap LOD geometry and hide innermost layer
   * at low quality.
   *
   * @param {RenderQualityLevel} level - New quality level
   */
  setQualityLevel(level: RenderQualityLevel): void {
    this.qualityLevel = level;

    for (let i = 0; i < this.shells.length; i++) {
      const shell = this.shells[i];
      const lodSet = this.shellLOD[i];
      if (shell && lodSet) {
        shell.geometry = lodSet[level];
      }
      if (i === this.shells.length - 1) {
        shell.visible = level !== 'low';
      }
    }
  }

  /**
   * Update the time uniform for the fire animation on all layers.
   *
   * @param {Object3D} _mesh - The Everdark group
   * @param {number} time - Elapsed time in seconds
   * @param {number} _deltaTime - Frame delta
   */
  update(
    _mesh: Object3D,
    time: number,
    _deltaTime: number,
    _ctx: SceneContext,
  ): void {
    for (let i = 0; i < this.materials.length; i++) {
      this.materials[i].uniforms.uTime.value = time;
    }
  }

  /**
   * Dispose of all Everdark layer resources.
   *
   * @param {Object3D} mesh - The Everdark group
   */
  dispose(mesh: Object3D): void {
    disposeSceneGraph(mesh);
    this.materials = [];
    this.shells = [];
    for (const lodSet of this.shellLOD) {
      lodSet.high.dispose();
      lodSet.medium.dispose();
      lodSet.low.dispose();
    }
    this.shellLOD = [];
  }
}
