/**
 * @fileoverview Celestial Body Factory — Strategy-Based Renderer Creation
 * @description Implements the Factory pattern to create the correct renderer
 * strategy based on the body's renderConfig.renderer type. Maps renderer type
 * strings to concrete ICelestialRenderer implementations.
 *
 * @module worldSim/celestials/CelestialBodyFactory
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { AsteroidBeltRenderer } from './AsteroidBeltRenderer';
import { EverdarkRenderer } from './EverdarkRenderer';
import { GasGiantRenderer } from './GasGiantRenderer';
import type { CelestialRendererType, ICelestialRenderer } from './interfaces';
import { PlanetRenderer } from './PlanetRenderer';
import { RingWorldRenderer } from './RingWorldRenderer';
import { StarRenderer } from './StarRenderer';
import { TowerWorldRenderer } from './TowerWorldRenderer';

/**
 * Map of renderer type identifiers to their constructor functions.
 * @constant {Record<CelestialRendererType, () => ICelestialRenderer>}
 */
const RENDERER_MAP: Record<CelestialRendererType, () => ICelestialRenderer> = {
  star: () => new StarRenderer(),
  planet: () => new PlanetRenderer(),
  gasGiant: () => new GasGiantRenderer(),
  ringWorld: () => new RingWorldRenderer(),
  towerWorld: () => new TowerWorldRenderer(),
  asteroidBelt: () => new AsteroidBeltRenderer(),
  everdark: () => new EverdarkRenderer(),
};

/**
 * Factory for creating celestial body renderer instances based on their type.
 * Uses the Strategy pattern — the factory selects the correct renderer strategy
 * from the RENDERER_MAP based on the renderer type string in the body's config.
 *
 * @class CelestialBodyFactory
 *
 * @example
 * ```ts
 * const renderer = CelestialBodyFactory.createRenderer('star');
 * const mesh = renderer.createMesh(bodyData);
 * scene.add(mesh);
 * ```
 */
export class CelestialBodyFactory {
  /**
   * Create a renderer instance for the given renderer type.
   *
   * @static
   * @param {CelestialRendererType} rendererType - The type key from renderConfig
   * @returns {ICelestialRenderer} A new renderer instance
   * @throws {Error} If the renderer type is unknown
   */
  static createRenderer(
    rendererType: CelestialRendererType,
  ): ICelestialRenderer {
    const factory = RENDERER_MAP[rendererType];

    if (!factory) {
      throw new Error(
        `Unknown celestial renderer type: "${rendererType}". ` +
          `Valid types: ${Object.keys(RENDERER_MAP).join(', ')}`,
      );
    }

    return factory();
  }

  /**
   * Check whether a renderer type is supported.
   *
   * @static
   * @param {string} type - Type string to check
   * @returns {boolean} True if the type has a registered renderer
   */
  static isValidType(type: string): type is CelestialRendererType {
    return type in RENDERER_MAP;
  }
}
