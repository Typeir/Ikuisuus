/**
 * @fileoverview Orbital Mechanics — Keplerian Ellipse Computations
 * @description Computes orbital positions for celestial bodies using Keplerian elements.
 * Supports elliptical orbits with inclination and eccentricity.
 *
 * @module worldSim/celestials/OrbitalMechanics
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { Vector3 } from 'three';

import type { OrbitalParameters, SurfacePosition } from './interfaces';

/** @constant {number} DEG_TO_RAD - Conversion factor from degrees to radians */
const DEG_TO_RAD = Math.PI / 180;

/**
 * Compute the 3D world position of a body in its Keplerian orbit at a given time.
 *
 * Uses mean anomaly → eccentric anomaly (Newton-Raphson) → true anomaly → position.
 * Inclination is applied as a rotation about the X-axis.
 *
 * @function computeOrbitalPosition
 * @param {OrbitalParameters} orbit - The orbital parameters
 * @param {number} time - Current time in arbitrary units
 * @returns {Vector3} World-space position of the orbiting body
 */
export function computeOrbitalPosition(
  orbit: OrbitalParameters,
  time: number,
): Vector3 {
  const { semiMajorAxis, eccentricity, inclination, period, phase } = orbit;

  const meanAnomaly =
    ((2 * Math.PI * time) / period + phase * DEG_TO_RAD) % (2 * Math.PI);
  const eccentricAnomaly = solveKeplerEquation(meanAnomaly, eccentricity);

  const cosE = Math.cos(eccentricAnomaly);
  const sinE = Math.sin(eccentricAnomaly);

  const x = semiMajorAxis * (cosE - eccentricity);
  const y = semiMajorAxis * Math.sqrt(1 - eccentricity * eccentricity) * sinE;

  const incRad = inclination * DEG_TO_RAD;
  const cosI = Math.cos(incRad);
  const sinI = Math.sin(incRad);

  return new Vector3(x, y * sinI, y * cosI);
}

/**
 * Solve Kepler's equation M = E - e*sin(E) for eccentric anomaly E
 * using Newton-Raphson iteration.
 *
 * @function solveKeplerEquation
 * @param {number} meanAnomaly - Mean anomaly in radians
 * @param {number} eccentricity - Orbital eccentricity (0 to <1)
 * @param {number} [tolerance=1e-6] - Convergence tolerance
 * @param {number} [maxIterations=20] - Maximum Newton-Raphson iterations
 * @returns {number} Eccentric anomaly in radians
 */
export function solveKeplerEquation(
  meanAnomaly: number,
  eccentricity: number,
  tolerance: number = 1e-6,
  maxIterations: number = 20,
): number {
  let E = meanAnomaly;

  for (let i = 0; i < maxIterations; i++) {
    const dE =
      (E - eccentricity * Math.sin(E) - meanAnomaly) /
      (1 - eccentricity * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < tolerance) break;
  }

  return E;
}

/**
 * Convert a latitude/longitude surface position to a 3D point on a sphere.
 *
 * @function surfacePositionToWorld
 * @param {SurfacePosition} surfacePos - Lat/lon in degrees
 * @param {number} radius - Radius of the sphere
 * @param {Vector3} centerPosition - World-space center of the sphere
 * @returns {Vector3} 3D world-space point on the sphere's surface
 */
export function surfacePositionToWorld(
  surfacePos: SurfacePosition,
  radius: number,
  centerPosition: Vector3,
): Vector3 {
  const latRad = surfacePos.lat * DEG_TO_RAD;
  const lonRad = surfacePos.lon * DEG_TO_RAD;

  const x = radius * Math.cos(latRad) * Math.cos(lonRad);
  const y = radius * Math.sin(latRad);
  const z = radius * Math.cos(latRad) * Math.sin(lonRad);

  return new Vector3(
    centerPosition.x + x,
    centerPosition.y + y,
    centerPosition.z + z,
  );
}

/**
 * Compute the orbital velocity at a given eccentric anomaly.
 * Useful for trailing effects or motion blur.
 *
 * @function computeOrbitalSpeed
 * @param {OrbitalParameters} orbit - Orbital parameters
 * @param {number} eccentricAnomaly - Eccentric anomaly in radians
 * @returns {number} Speed in scene units per time unit
 */
export function computeOrbitalSpeed(
  orbit: OrbitalParameters,
  eccentricAnomaly: number,
): number {
  const { semiMajorAxis, eccentricity, period } = orbit;
  const meanMotion = (2 * Math.PI) / period;
  const r = semiMajorAxis * (1 - eccentricity * Math.cos(eccentricAnomaly));
  return (
    (meanMotion *
      semiMajorAxis *
      semiMajorAxis *
      Math.sqrt(1 - eccentricity * eccentricity)) /
    r
  );
}
