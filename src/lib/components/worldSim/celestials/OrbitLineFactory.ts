/**
 * @fileoverview Orbit Line Factory — Generates Elliptical Orbit Ring Meshes
 * @description Creates thin torus-like ring meshes that trace each celestial body's
 * Keplerian elliptical orbit path. Each orbit is a single `TubeGeometry` extruded
 * along an `EllipseCurve`, producing one draw call per orbit with consistent visual
 * thickness at any zoom level. Supports inclined orbits and parent-relative parenting.
 *
 * @module worldSim/celestials/OrbitLineFactory
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
  Curve,
  EllipseCurve,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  TubeGeometry,
  Vector3,
} from 'three';
import type { OrbitalParameters } from './interfaces';
import { DEG_TO_RAD } from './OrbitalMechanics';

/** @constant {number} ORBIT_TUBE_SEGMENTS - Segments around the orbit path */
const ORBIT_TUBE_SEGMENTS = 128;

/** @constant {number} ORBIT_TUBE_RADIAL_SEGMENTS - Cross-section segments for the tube */
const ORBIT_TUBE_RADIAL_SEGMENTS = 4;

/** @constant {number} ORBIT_TUBE_RADIUS - Tube cross-section radius (world units) */
const ORBIT_TUBE_RADIUS = 2;

/** @constant {number} ORBIT_LINE_OPACITY - Default opacity for orbit rings */
const ORBIT_LINE_OPACITY = 0.45;

/** @constant {number} ORBIT_LINE_COLOR - Default color for orbit rings (accent green) */
const ORBIT_LINE_COLOR = 0x8fd3a1;

/**
 * 3D curve adaptor that lifts a 2D EllipseCurve into 3D space with inclination.
 * The ellipse lies in the XZ plane and is tilted by the inclination angle around
 * the X axis.
 *
 * @class OrbitCurve3D
 * @extends {Curve<Vector3>}
 */
class OrbitCurve3D extends Curve<Vector3> {
  /** @property {EllipseCurve} ellipse - The underlying 2D ellipse */
  private ellipse: EllipseCurve;

  /** @property {number} cosI - Cosine of the inclination angle */
  private cosI: number;

  /** @property {number} sinI - Sine of the inclination angle */
  private sinI: number;

  /**
   * @param {number} semiMajorAxis - Semi-major axis
   * @param {number} semiMinorAxis - Semi-minor axis
   * @param {number} eccentricity - Orbital eccentricity
   * @param {number} inclinationDeg - Inclination in degrees
   */
  constructor(
    semiMajorAxis: number,
    semiMinorAxis: number,
    eccentricity: number,
    inclinationDeg: number,
  ) {
    super();
    const centerOffset = semiMajorAxis * eccentricity;
    this.ellipse = new EllipseCurve(
      -centerOffset,
      0,
      semiMajorAxis,
      semiMinorAxis,
      0,
      Math.PI * 2,
      false,
      0,
    );
    this.cosI = Math.cos(inclinationDeg * DEG_TO_RAD);
    this.sinI = Math.sin(inclinationDeg * DEG_TO_RAD);
  }

  /**
   * Sample a point on the 3D orbit curve at parameter t (0–1).
   *
   * @param {number} t - Parameter along the curve
   * @param {Vector3} [optionalTarget] - Optional target vector to write into
   * @returns {Vector3} Point on the orbit in world space
   */
  getPoint(t: number, optionalTarget?: Vector3): Vector3 {
    const target = optionalTarget ?? new Vector3();
    const p = this.ellipse.getPoint(t);
    return target.set(p.x, p.y * this.sinI, p.y * this.cosI);
  }
}

/**
 * Creates a single orbit ring mesh for one celestial body.
 *
 * @function createOrbitRing
 * @param {OrbitalParameters} orbit - Keplerian orbital parameters
 * @param {string} bodyId - ID of the body this orbit belongs to
 * @returns {Mesh} A tube mesh tracing the orbit ellipse
 */
export function createOrbitRing(
  orbit: OrbitalParameters,
  bodyId: string,
): Mesh {
  const { semiMajorAxis, eccentricity, inclination } = orbit;
  const semiMinorAxis =
    semiMajorAxis * Math.sqrt(1 - eccentricity * eccentricity);

  const curve = new OrbitCurve3D(
    semiMajorAxis,
    semiMinorAxis,
    eccentricity,
    inclination,
  );

  const geometry = new TubeGeometry(
    curve,
    ORBIT_TUBE_SEGMENTS,
    ORBIT_TUBE_RADIUS,
    ORBIT_TUBE_RADIAL_SEGMENTS,
    true,
  );

  const material = new MeshBasicMaterial({
    color: ORBIT_LINE_COLOR,
    transparent: true,
    opacity: ORBIT_LINE_OPACITY,
    depthWrite: false,
  });

  const mesh = new Mesh(geometry, material);
  mesh.name = `orbit-ring-${bodyId}`;
  mesh.renderOrder = -1;

  return mesh;
}

/**
 * Creates orbit ring meshes for all bodies that have orbital parameters.
 * Bodies with a parentBodyId have their ring added as a child of the parent
 * mesh so it moves with the parent automatically.
 *
 * @function createAllOrbitLines
 * @param {Array<{ id: string; orbit: OrbitalParameters | null; parentBodyId?: string }>} bodies - Body definitions
 * @param {Map<string, Object3D>} meshMap - Map of body ID to scene mesh (for parenting)
 * @returns {Map<string, Mesh>} Map of body ID to orbit ring mesh
 */
export function createAllOrbitLines(
  bodies: Array<{
    id: string;
    orbit: OrbitalParameters | null;
    parentBodyId?: string;
  }>,
  meshMap: Map<string, Object3D>,
): Map<string, Mesh> {
  const rings = new Map<string, Mesh>();

  for (const body of bodies) {
    if (!body.orbit) continue;

    const ring = createOrbitRing(body.orbit, body.id);

    if (body.parentBodyId) {
      const parentMesh = meshMap.get(body.parentBodyId);
      if (parentMesh) {
        parentMesh.add(ring);
      }
    }

    rings.set(body.id, ring);
  }

  return rings;
}
