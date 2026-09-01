/**
 * @fileoverview Shared radial glow sprite factory.
 * @description Creates additive-blended glow sprites from a procedural radial
 * gradient CanvasTexture. Texture is cached across instances. Also exports a
 * radial-gradient texture factory used by StarRenderer and GasGiantRenderer.
 *
 * @module modules/world-sim/infrastructure/effects/CelestialGlow
 * @version 1.1.0
 * @author Typeir
 * @since 1.0.0
 */

import {
    AdditiveBlending,
    CanvasTexture,
    Color,
    Sprite,
    SpriteMaterial,
} from 'three';
import {
    DEFAULT_GLOW_OPACITY,
    DEFAULT_GLOW_SCALE,
} from '@/modules/world-sim/infrastructure/config/sceneTuning';

/** @constant {number} GLOW_TEXTURE_SIZE - Resolution of the procedural glow texture */
const GLOW_TEXTURE_SIZE = 128;

/** @type {CanvasTexture | null} Cached glow texture shared by all instances */
let cachedGlowTexture: CanvasTexture | null = null;

/** @type {Map<string, CanvasTexture>} Cached gradient textures by size+stops key */
const gradientTextureCache: Map<string, CanvasTexture> = new Map();

/**
 * A color stop for a radial gradient texture.
 *
 * @interface GradientStop
 * @property {number} offset - Position in the gradient (0 to 1)
 * @property {string} color - CSS color string (typically rgba)
 */
export interface GradientStop {
  /** @property {number} offset - Position in the gradient (0 to 1) */
  offset: number;
  /** @property {string} color - CSS color string */
  color: string;
}

/**
 * Create a square CanvasTexture with a customizable radial gradient.
 * Used by star corona, gas giant haze, and celestial glow sprites.
 *
 * @function createRadialGradientTexture
 * @param {number} size - Texture resolution in pixels (square)
 * @param {GradientStop[]} stops - Ordered gradient color stops
 * @returns {CanvasTexture} Procedural radial gradient texture
 */
export function createRadialGradientTexture(
  size: number,
  stops: GradientStop[],
): CanvasTexture {
  const cacheKey = `${size}|${JSON.stringify(stops)}`;
  const cached = gradientTextureCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const half = size / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  for (const stop of stops) {
    gradient.addColorStop(stop.offset, stop.color);
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new CanvasTexture(canvas);
  gradientTextureCache.set(cacheKey, texture);

  return texture;
}

/** @constant {GradientStop[]} GLOW_STOPS - Default glow gradient stops */
const GLOW_STOPS: GradientStop[] = [
  { offset: 0, color: 'rgba(255, 255, 255, 1.0)' },
  { offset: 0.15, color: 'rgba(255, 255, 255, 0.7)' },
  { offset: 0.4, color: 'rgba(255, 255, 255, 0.25)' },
  { offset: 0.7, color: 'rgba(255, 255, 255, 0.05)' },
  { offset: 1.0, color: 'rgba(255, 255, 255, 0.0)' },
];

/**
 * Create or return the cached radial gradient glow texture.
 * The texture is a white radial gradient from opaque center to transparent edge.
 *
 * @returns {CanvasTexture} Shared glow texture
 */
function getGlowTexture(): CanvasTexture {
  if (cachedGlowTexture) return cachedGlowTexture;
  cachedGlowTexture = createRadialGradientTexture(
    GLOW_TEXTURE_SIZE,
    GLOW_STOPS,
  );
  return cachedGlowTexture;
}

/**
 * Create a glow sprite for a celestial body with additive blending.
 *
 * @function createCelestialGlow
 * @param {number} radius - Body radius in scene units (used to scale the sprite)
 * @param {Color | string} color - Glow tint color
 * @param {number} [scale] - Glow scale multiplier relative to radius (default: 3.0)
 * @param {number} [opacity] - Glow opacity (default: 0.18)
 * @returns {Sprite} Configured glow sprite ready to add to a group
 */
export function createCelestialGlow(
  radius: number,
  color: Color | string,
  scale: number = DEFAULT_GLOW_SCALE,
  opacity: number = DEFAULT_GLOW_OPACITY,
): Sprite {
  const glowColor = color instanceof Color ? color : new Color(color);

  const material = new SpriteMaterial({
    map: getGlowTexture(),
    color: glowColor,
    transparent: true,
    opacity,
    blending: AdditiveBlending,
    depthWrite: false,
  });

  const sprite = new Sprite(material);
  sprite.scale.setScalar(radius * scale);
  sprite.name = 'celestial-glow';

  return sprite;
}
