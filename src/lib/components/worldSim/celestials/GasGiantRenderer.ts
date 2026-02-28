/**
 * @fileoverview Gas Giant Renderer — Banded Sphere with Storm Effects
 * @description Renders gas giant bodies (Länsihenkï, Itähenkï) with procedural
 * color banding and animated opacity variations to simulate atmospheric storms.
 *
 * @module worldSim/celestials/GasGiantRenderer
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
    AdditiveBlending,
    Color,
    Mesh,
    MeshPhongMaterial,
    Object3D,
    SphereGeometry,
    Sprite,
    SpriteMaterial,
} from 'three';
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
 * Renders gas giant celestial bodies with banded surface and atmospheric haze.
 *
 * @class GasGiantRenderer
 * @implements {ICelestialRenderer}
 */
export class GasGiantRenderer implements ICelestialRenderer {
  /** @property {number} rotationSpeed - Axial rotation speed in rad/s */
  private rotationSpeed: number = DEFAULT_ROTATION_SPEED;

  /** @property {Sprite | null} hazeSprite - Atmospheric haze sprite */
  private hazeSprite: Sprite | null = null;

  /** @property {Mesh | null} bodyMesh - Stored reference to the gas giant body mesh */
  private bodyMesh: Mesh | null = null;

  /**
   * Create a gas giant mesh with banded material and haze sprite.
   *
   * @param {CelestialBodyData | BoundaryData} data - Body definition data
   * @returns {Object3D} Group containing the gas giant body and haze
   */
  createMesh(data: CelestialBodyData | BoundaryData): Object3D {
    const group = new Object3D();
    group.name = `gasGiant-${data.id}`;

    const config = data.renderConfig as GasGiantRenderConfig;
    const baseColor = new Color((config.baseColor as string) ?? '#cc8844');
    const bandColor = new Color((config.bandColor as string) ?? '#aa6633');
    this.rotationSpeed =
      (config.rotationSpeed as number) ?? DEFAULT_ROTATION_SPEED;

    const geometry = new SphereGeometry(data.radius, 48, 48);
    const material = new MeshPhongMaterial({
      color: baseColor,
      emissive: bandColor,
      emissiveIntensity: 0.1,
      shininess: 10,
      flatShading: false,
    });

    const body = new Mesh(geometry, material);
    body.name = 'gasGiant-body';
    this.bodyMesh = body;
    group.add(body);

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
    group.add(this.hazeSprite);

    const glowColor = (config.atmosphereColor as string) ?? '#ffddaa';
    const glow = createCelestialGlow(data.radius, glowColor, 7.0, 0.35);
    group.add(glow);

    return group;
  }

  /**
   * Rotate the gas giant and animate storm haze each frame.
   *
   * @param {Object3D} mesh - The gas giant group
   * @param {number} time - Elapsed time in seconds
   * @param {number} deltaTime - Frame delta
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

    if (this.hazeSprite) {
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
  }
}
