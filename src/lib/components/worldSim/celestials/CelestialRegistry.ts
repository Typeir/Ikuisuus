/**
 * @fileoverview Celestial Registry — Runtime Query Layer Over Registry Data
 * @description Wraps the static blackCradleRegistry.json data with typed query methods.
 * Provides lookups by ID, type, and content path, plus region retrieval.
 *
 * @module worldSim/celestials/CelestialRegistry
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import registryData from '../data/blackCradleRegistry.json';
import type {
    BoundaryData,
    CelestialBodyData,
    CelestialBodyType,
    CelestialRegion,
    CelestialRegistryData,
    CollisionPairData,
} from './interfaces';

/**
 * Runtime query interface over the Black Cradle celestial registry.
 * Loads data once from the JSON import and provides indexed lookups.
 *
 * @class CelestialRegistry
 *
 * @example
 * ```ts
 * const registry = new CelestialRegistry();
 * const damocles = registry.getBodyById('damocles');
 * const regions = registry.getRegions('damocles');
 * ```
 */
export class CelestialRegistry {
  /** @property {CelestialRegistryData} data - The raw registry data */
  private data: CelestialRegistryData;

  /** @property {Map<string, CelestialBodyData>} bodyIndex - Index of bodies by ID */
  private bodyIndex: Map<string, CelestialBodyData>;

  /** @property {CelestialRegistry | null} instance - Lazy singleton instance */
  private static instance: CelestialRegistry | null = null;

  /**
   * Get the shared singleton CelestialRegistry instance.
   * Creates it on first call; subsequent calls return the same instance.
   *
   * @static
   * @returns {CelestialRegistry} The shared registry instance
   */
  static shared(): CelestialRegistry {
    if (!CelestialRegistry.instance) {
      CelestialRegistry.instance = new CelestialRegistry();
    }
    return CelestialRegistry.instance;
  }

  /**
   * Create a new registry instance, building internal indexes.
   *
   * @param {CelestialRegistryData} [customData] - Optional override data for testing
   */
  constructor(customData?: CelestialRegistryData) {
    this.data = (customData ?? registryData) as CelestialRegistryData;
    this.bodyIndex = new Map();

    for (const body of this.data.bodies) {
      this.bodyIndex.set(body.id, body);
    }
  }

  /**
   * Get all celestial bodies in the registry.
   *
   * @returns {CelestialBodyData[]} Array of all body definitions
   */
  getAllBodies(): CelestialBodyData[] {
    return this.data.bodies;
  }

  /**
   * Get the Everdark boundary definition.
   *
   * @returns {BoundaryData} The boundary data
   */
  getBoundary(): BoundaryData {
    return this.data.boundary;
  }

  /**
   * Get a specific body by its ID.
   *
   * @param {string} id - Body identifier
   * @returns {CelestialBodyData | undefined} The body data, or undefined if not found
   */
  getBodyById(id: string): CelestialBodyData | undefined {
    return this.bodyIndex.get(id);
  }

  /**
   * Get all bodies of a specific type.
   *
   * @param {CelestialBodyType} type - The body type to filter by
   * @returns {CelestialBodyData[]} Bodies matching the type
   */
  getBodiesByType(type: CelestialBodyType): CelestialBodyData[] {
    return this.data.bodies.filter((body) => body.type === type);
  }

  /**
   * Get all regions for a specific body.
   *
   * @param {string} bodyId - The parent body's ID
   * @returns {CelestialRegion[]} Array of regions, empty if body not found
   */
  getRegions(bodyId: string): CelestialRegion[] {
    const body = this.bodyIndex.get(bodyId);
    return body?.regions ?? [];
  }

  /**
   * Get a specific region by body ID and region ID.
   *
   * @param {string} bodyId - The parent body's ID
   * @param {string} regionId - The region's ID
   * @returns {CelestialRegion | undefined} The region, or undefined if not found
   */
  getRegion(bodyId: string, regionId: string): CelestialRegion | undefined {
    const regions = this.getRegions(bodyId);
    return regions.find((r) => r.id === regionId);
  }

  /**
   * Get all collision-pair definitions declared in the registry. Each pair
   * describes two bodies whose proximity drives a collision-cloud effect.
   *
   * @returns {CollisionPairData[]} Array of collision pairs (empty if none defined)
   */
  getCollisionPairs(): CollisionPairData[] {
    return this.data.collisionPairs ?? [];
  }

  /**
   * Look up a single collision pair by its stable id.
   *
   * @param {string} id - The pair identifier
   * @returns {CollisionPairData | undefined} The pair, or undefined if not found
   */
  getCollisionPair(id: string): CollisionPairData | undefined {
    return this.getCollisionPairs().find((p) => p.id === id);
  }
}
