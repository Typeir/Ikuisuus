/**
 * @fileoverview Maps renderer type strings to concrete ICelestialRenderer factories.
 *
 * @module modules/world-sim/infrastructure/geometry/factories/CelestialBodyFactory
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { AsteroidBeltRenderer } from '@/modules/world-sim/infrastructure/renderers/AsteroidBeltRenderer';
import { BloodOceanRenderer } from '@/modules/world-sim/infrastructure/renderers/BloodOceanRenderer';
import { EverdarkRenderer } from '@/modules/world-sim/infrastructure/renderers/EverdarkRenderer';
import { GasGiantRenderer } from '@/modules/world-sim/infrastructure/renderers/GasGiantRenderer';
import type { CelestialRendererType, ICelestialRenderer } from '@/modules/world-sim/domain/celestials/celestialBody.types';
import { PlanetRenderer } from '@/modules/world-sim/infrastructure/renderers/PlanetRenderer';
import { RingWorldRenderer } from '@/modules/world-sim/infrastructure/renderers/RingWorldRenderer';
import { StarRenderer } from '@/modules/world-sim/infrastructure/renderers/StarRenderer';
import { TowerWorldRenderer } from '@/modules/world-sim/infrastructure/renderers/TowerWorldRenderer';

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
  bloodOcean: () => new BloodOceanRenderer(),
};

/**
 * Creates celestial body renderer instances.
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
}
