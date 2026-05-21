/**
 * @fileoverview Collision Cloud Effect — Länsihenki × Itähenki Impact Visual
 * @description A proximity-driven three-layer scene decoration that appears
 * when Länsihenki and Itähenki approach their crossing point. As the two gas
 * giants converge, a spherical debris cloud grows at their midpoint, swells
 * to opaquely cover the collision, then shrinks and fades as they separate.
 *
 * Layer order (back to front):
 * 1. Debris field — slowly tumbling Points sphere of hot white-yellow particles
 * 2. Cloud shell  — vertex-displaced ShaderMaterial sphere with patchy opacity
 * 3. Corona glow  — BackSide AdditiveBlending atmosphere shell for outer flare
 *
 * This object is not a CelestialBody and has no registry entry. It is owned
 * and updated entirely by WorldSimMediator.
 *
 * @module worldSim/celestials/CollisionCloudEffect
 * @version 1.0.0
 * @author Typeir
 * @since 2026-05-21
 */

import {
    AdditiveBlending,
    BackSide,
    BufferGeometry,
    Color,
    Float32BufferAttribute,
    Group,
    Mesh,
    Points,
    PointsMaterial,
    Scene,
    ShaderMaterial,
    SphereGeometry,
    Vector3
} from 'three';
import atmosphereFrag from '../shaders/atmosphere.frag.glsl';
import atmosphereVert from '../shaders/atmosphere.vert.glsl';
import collisionCloudFrag from '../shaders/collisionCloud.frag.glsl';
import collisionCloudVert from '../shaders/collisionCloud.vert.glsl';
import noise3d from '../shaders/noise3d.glsl';

/** @constant {number} MAX_INFLUENCE_DISTANCE - Distance (units) at which the cloud begins to appear */
const MAX_INFLUENCE_DISTANCE = 900;

/** @constant {number} MAX_CLOUD_RADIUS - Maximum cloud group scale multiplier at full influence */
const MAX_CLOUD_RADIUS = 320;

/** @constant {number} CORONA_SCALE - Corona shell radius relative to the cloud shell (>1 = larger) */
const CORONA_SCALE = 1.35;

/** @constant {number} DEBRIS_COUNT - Number of debris particles in the field */
const DEBRIS_COUNT = 380;

/** @constant {number} DEBRIS_ROTATION_SPEED - Tumble speed of the debris field (rad/s) */
const DEBRIS_ROTATION_SPEED = 0.0006;

/** @constant {number} CLOUD_SEGMENTS_HIGH - Sphere subdivisions at high quality */
const CLOUD_SEGMENTS_HIGH = 48;

/** @constant {number} CLOUD_SEGMENTS_LOW - Sphere subdivisions at low quality */
const CLOUD_SEGMENTS_LOW = 24;

/** @constant {number} CORONA_SEGMENTS - Sphere subdivisions for the lightweight corona shell */
const CORONA_SEGMENTS = 32;

/**
 * Proximity-driven, three-layer collision cloud centered between Länsihenki
 * and Itähenki. Scales from invisible to fully opaque as the bodies converge,
 * then dissolves again as they separate.
 *
 * Usage:
 * ```typescript
 * const effect = new CollisionCloudEffect();
 * effect.addToScene(scene);
 * // each frame:
 * effect.update(lansiPos, itaPos, time, deltaTime);
 * // on dispose:
 * effect.removeFromScene(scene);
 * effect.dispose();
 * ```
 *
 * @class CollisionCloudEffect
 */
export class CollisionCloudEffect {
  /** @property {Group} group - Root Three.js Group added to the scene */
  private group: Group;

  /** @property {Points} debrisMesh - Spherically distributed hot particle debris */
  private debrisMesh: Points;

  /** @property {PointsMaterial} debrisMaterial - Material for debris opacity control */
  private debrisMaterial: PointsMaterial;

  /** @property {Mesh} cloudMesh - Vertex-displaced, patchy cloud shell */
  private cloudMesh: Mesh;

  /** @property {ShaderMaterial} cloudMaterial - Cloud shell shader with influence-driven alpha */
  private cloudMaterial: ShaderMaterial;

  /** @property {Mesh} coronaMesh - Outer additive corona glow shell */
  private coronaMesh: Mesh;

  /** @property {ShaderMaterial} coronaMaterial - Corona shader for intensity control */
  private coronaMaterial: ShaderMaterial;

  /** @property {BufferGeometry} debrisGeometry - Geometry for the debris Points */
  private debrisGeometry: BufferGeometry;

  /** @property {SphereGeometry} cloudGeometry - High-detail sphere for the cloud shell */
  private cloudGeometry: SphereGeometry;

  /** @property {SphereGeometry} cloudGeometryLow - Low-detail sphere for the cloud shell */
  private cloudGeometryLow: SphereGeometry;

  /** @property {SphereGeometry} coronaGeometry - Sphere for the corona shell */
  private coronaGeometry: SphereGeometry;

  /**
   * Build all three layers. The group starts at scale 0 (invisible) and is
   * driven to its full size by the first `update()` call.
   */
  constructor() {
    this.group = new Group();
    this.group.name = 'collisionCloud:lansihenki-itahenki';
    this.group.scale.setScalar(0);

    /* ------------------------------------------------------------------ */
    /* Layer 1: Debris field                                                */
    /* ------------------------------------------------------------------ */
    this.debrisGeometry = new BufferGeometry();
    const positions = new Float32Array(DEBRIS_COUNT * 3);

    for (let i = 0; i < DEBRIS_COUNT; i++) {
      /* Uniform random distribution inside a unit sphere */
      let x: number, y: number, z: number;
      do {
        x = Math.random() * 2 - 1;
        y = Math.random() * 2 - 1;
        z = Math.random() * 2 - 1;
      } while (x * x + y * y + z * z > 1);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    this.debrisGeometry.setAttribute(
      'position',
      new Float32BufferAttribute(positions, 3),
    );

    this.debrisMaterial = new PointsMaterial({
      color: new Color('#fff8c0'),
      size: 3.2,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });

    this.debrisMesh = new Points(this.debrisGeometry, this.debrisMaterial);
    this.debrisMesh.name = 'collisionCloud-debris';
    this.debrisMesh.frustumCulled = false;
    this.group.add(this.debrisMesh);

    /* ------------------------------------------------------------------ */
    /* Layer 2: Cloud shell (unit sphere — scale driven at group level)    */
    /* ------------------------------------------------------------------ */
    this.cloudGeometry = new SphereGeometry(
      1,
      CLOUD_SEGMENTS_HIGH,
      CLOUD_SEGMENTS_HIGH,
    );
    this.cloudGeometryLow = new SphereGeometry(
      1,
      CLOUD_SEGMENTS_LOW,
      CLOUD_SEGMENTS_LOW,
    );

    this.cloudMaterial = new ShaderMaterial({
      vertexShader: noise3d + '\n' + collisionCloudVert,
      fragmentShader: collisionCloudFrag,
      uniforms: {
        uTime: { value: 0 },
        uNoiseScale: { value: 0.8 },
        uDisplacementScale: { value: 0.12 },
        uInnerColor: { value: new Color('#fff4d6') },
        uOuterColor: { value: new Color('#5e1000') },
        uAlpha: { value: 0 },
        uLightDir: { value: new Vector3(1, 0.5, 0.5).normalize() },
        uAmbient: { value: 0.3 },
      },
      transparent: true,
      depthWrite: false,
    });

    this.cloudMesh = new Mesh(this.cloudGeometry, this.cloudMaterial);
    this.cloudMesh.name = 'collisionCloud-shell';
    this.cloudMesh.frustumCulled = false;
    this.group.add(this.cloudMesh);

    /* ------------------------------------------------------------------ */
    /* Layer 3: Corona (slightly larger unit sphere, BackSide additive)    */
    /* ------------------------------------------------------------------ */
    this.coronaGeometry = new SphereGeometry(
      CORONA_SCALE,
      CORONA_SEGMENTS,
      CORONA_SEGMENTS,
    );

    this.coronaMaterial = new ShaderMaterial({
      vertexShader: atmosphereVert,
      fragmentShader: atmosphereFrag,
      uniforms: {
        uColor: { value: new Color('#ff6622') },
        uIntensity: { value: 0 },
      },
      transparent: true,
      blending: AdditiveBlending,
      side: BackSide,
      depthWrite: false,
    });

    this.coronaMesh = new Mesh(this.coronaGeometry, this.coronaMaterial);
    this.coronaMesh.name = 'collisionCloud-corona';
    this.coronaMesh.frustumCulled = false;
    this.group.add(this.coronaMesh);
  }

  /**
   * Add the collision cloud group to a Three.js scene.
   *
   * @param {Scene} scene - The Three.js scene to add the group to
   */
  addToScene(scene: Scene): void {
    scene.add(this.group);
  }

  /**
   * Remove the collision cloud group from a Three.js scene.
   *
   * @param {Scene} scene - The Three.js scene to remove the group from
   */
  removeFromScene(scene: Scene): void {
    scene.remove(this.group);
  }

  /**
   * Update the cloud each frame. Computes the proximity influence from the
   * distance between the two gas giant positions, repositions the group at
   * their midpoint, and drives all layer opacities and scales.
   *
   * Influence curve: `raw = clamp(1 − dist / MAX_INFLUENCE_DISTANCE, 0, 1)`,
   * then squared for a dramatic near-collision peak.
   *
   * @param {Vector3} lansPos - Current world position of Länsihenki
   * @param {Vector3} itaPos  - Current world position of Itähenki
   * @param {number}  time      - Elapsed time in seconds (for shader animation)
   * @param {number}  deltaTime - Frame delta in seconds (for debris tumble)
   */
  update(
    lansPos: Vector3,
    itaPos: Vector3,
    time: number,
    deltaTime: number,
  ): void {
    const dist = lansPos.distanceTo(itaPos);
    const raw = Math.max(0, 1 - dist / MAX_INFLUENCE_DISTANCE);
    const influence = raw * raw;

    /* Reposition group at midpoint between the two bodies */
    this.group.position.lerpVectors(lansPos, itaPos, 0.5);

    /* Scale the whole group — cloud "grows out" from a point */
    this.group.scale.setScalar(influence * MAX_CLOUD_RADIUS);

    /* Drive individual layer opacities */
    this.cloudMaterial.uniforms.uAlpha.value = influence * 0.82;
    this.cloudMaterial.uniforms.uTime.value = time;
    this.debrisMaterial.opacity = influence * 0.85;
    this.coronaMaterial.uniforms.uIntensity.value = influence * 2.4;

    /* Slowly tumble the debris cloud for an organic feel */
    this.debrisMesh.rotation.y += DEBRIS_ROTATION_SPEED * deltaTime;
    this.debrisMesh.rotation.x += DEBRIS_ROTATION_SPEED * 0.4 * deltaTime;
  }

  /**
   * Dispose of all GPU resources. Call `removeFromScene` first.
   */
  dispose(): void {
    this.debrisGeometry.dispose();
    this.cloudGeometry.dispose();
    this.cloudGeometryLow.dispose();
    this.coronaGeometry.dispose();
    this.debrisMaterial.dispose();
    this.cloudMaterial.dispose();
    this.coronaMaterial.dispose();
  }
}
