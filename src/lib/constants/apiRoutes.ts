/**
 * @fileoverview API Routes Enum
 * @description Enum of API endpoint path constants.
 *
 * @module lib/constants/apiRoutes
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

/**
 * API endpoint routes
 *
 * @enum {string}
 */
export enum ApiRoutes {
  /** Monsters metadata endpoint */
  Monsters = '/api/monsters',

  /** Heirlooms metadata endpoint */
  Heirlooms = '/api/heirlooms',

  /** Spells metadata endpoint */
  Spells = '/api/spells',

  /** Trinkets metadata endpoint */
  Trinkets = '/api/trinkets',

  /** Find nearest route for 404 suggestions */
  FindNearestRoute = '/api/find-nearest-route',

  /** Discovery API endpoint */
  Discovery = '/api/discovery',
}
