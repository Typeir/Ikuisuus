/**
 * @fileoverview Star Renderer — Emissive Sphere with Corona Effect
 * @description Renders Kultharja as a bright emissive sphere with a glowing corona
 * halo effect. Uses additive blending for the outer glow sprite.
 *
 * @module worldSim/celestials/StarRenderer
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
  AdditiveBlending,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  RingGeometry,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
} from 'three';
import { createRadialGradientTexture } from './CelestialGlow';
import { disposeSceneGraph } from './disposeUtils';
import type {
  BoundaryData,
  CelestialBodyData,
  ICelestialRenderer,
  SceneContext,
  StarRenderConfig,
} from './interfaces';

/** @constant {number} CORONA_SCALE - Scale multiplier for the corona sprite relative to body radius */
const CORONA_SCALE = 6.0;

/** @constant {number} PULSE_SPEED - Speed of the corona pulsation animation */
const PULSE_SPEED = 0.5;

/** @constant {number} PULSE_AMPLITUDE - Amplitude of the corona pulsation */
const PULSE_AMPLITUDE = 0.15;

/** @constant {number} GLOW_TEXTURE_SIZE - Resolution of the procedural glow texture */
const GLOW_TEXTURE_SIZE = 256;

/**
 * Gradient stops for the star corona glow texture.
 * Brighter center with smooth falloff for a hot emissive look.
 * @constant {import('./CelestialGlow').GradientStop[]}
 */
const CORONA_GLOW_STOPS = [
  { offset: 0, color: 'rgba(255, 255, 255, 1.0)' },
  { offset: 0.2, color: 'rgba(255, 255, 255, 0.8)' },
  { offset: 0.5, color: 'rgba(255, 255, 255, 0.3)' },
  { offset: 0.8, color: 'rgba(255, 255, 255, 0.05)' },
  { offset: 1.0, color: 'rgba(255, 255, 255, 0.0)' },
];

/**
 * Renders a star body with emissive material and corona glow effect.
 *
 * @class StarRenderer
 * @implements {ICelestialRenderer}
 */
export class StarRenderer implements ICelestialRenderer {
  /** @property {Mesh | null} coreMesh - The star's solid sphere mesh */
  private coreMesh: Mesh | null = null;

  /** @property {Sprite | null} coronaSprite - The glow sprite around the star */
  private coronaSprite: Sprite | null = null;

  /** @property {Mesh | null} ringMesh - The corona ring mesh (billboarded toward camera) */
  private ringMesh: Mesh | null = null;

  /**
   * Create the star mesh group with emissive sphere and corona sprite.
   *
   * @param {CelestialBodyData | BoundaryData} data - Body definition data
   * @returns {Object3D} Group containing the star sphere and corona
   */
  createMesh(data: CelestialBodyData | BoundaryData): Object3D {
    const group = new Object3D();
    group.name = `star-${data.id}`;

    const config = data.renderConfig as StarRenderConfig;
    const emissiveColor = new Color(
      (config.emissiveColor as string) ?? '#ffcc44',
    );
    const coronaColor = new Color((config.coronaColor as string) ?? '#ff8800');

    const coreGeometry = new SphereGeometry(data.radius, 32, 32);
    const coreMaterial = new MeshBasicMaterial({
      color: emissiveColor,
    });
    this.coreMesh = new Mesh(coreGeometry, coreMaterial);
    this.coreMesh.name = 'star-core';
    group.add(this.coreMesh);

    const coronaMaterial = new SpriteMaterial({
      map: createRadialGradientTexture(GLOW_TEXTURE_SIZE, CORONA_GLOW_STOPS),
      color: coronaColor,
      transparent: true,
      opacity: 0.7,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    this.coronaSprite = new Sprite(coronaMaterial);
    this.coronaSprite.scale.setScalar(data.radius * CORONA_SCALE);
    this.coronaSprite.name = 'star-corona';
    group.add(this.coronaSprite);

    const ringGeometry = new RingGeometry(
      data.radius * 1.05,
      data.radius * 1.2,
      64,
    );
    const ringMaterial = new MeshBasicMaterial({
      color: coronaColor,
      transparent: true,
      opacity: 0.35,
      side: DoubleSide,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    const ring = new Mesh(ringGeometry, ringMaterial);
    ring.name = 'star-ring';
    this.ringMesh = ring;
    group.add(ring);

    return group;
  }

  /**
   * Animate the corona pulsation each frame.
   *
   * @param {Object3D} _mesh - The star group (unused, using internal refs)
   * @param {number} time - Elapsed time in seconds
   * @param {number} _deltaTime - Frame delta (unused)
   */
  update(
    _mesh: Object3D,
    time: number,
    _deltaTime: number,
    ctx: SceneContext,
  ): void {
    if (this.coronaSprite) {
      const pulse = 1 + Math.sin(time * PULSE_SPEED) * PULSE_AMPLITUDE;
      const radius = this.coreMesh
        ? (this.coreMesh.geometry as SphereGeometry).parameters.radius
        : 1;
      this.coronaSprite.scale.setScalar(radius * CORONA_SCALE * pulse);
    }

    if (this.ringMesh) {
      this.ringMesh.lookAt(ctx.camera.position);
    }
  }

  /**
   * Dispose of star resources.
   *
   * @param {Object3D} mesh - The star group
   */
  dispose(mesh: Object3D): void {
    disposeSceneGraph(mesh);
  }
}
