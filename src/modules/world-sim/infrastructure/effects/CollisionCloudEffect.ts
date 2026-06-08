/**
 * @fileoverview Collision Cloud Effect — Länsihenki × Itähenki Impact Visual
 * @description Multi-layer collision visual built around a phase-time state
 *   machine: the moment surface contact triggers, a phase clock starts and
 *   drives an unbounded logarithmic growth curve, a smoothstep opacity
 *   envelope (ramp up to apex, ramp down through fade), and a high-frequency
 *   capped jitter coupled to live opacity so motion never freezes. Outer
 *   layers keep expanding past apex and only fade through alpha; the core's
 *   vertex displacement collapses with opacity so it stabilizes into a smooth
 *   sphere as the explosion dissipates. Owned entirely by WorldSimMediator.
 *
 * @module worldSim/celestials/CollisionCloudEffect
 * @version 3.0.0
 * @author Typeir
 * @since 2026-05-21
 */

import {
  BufferGeometry,
  Group,
  Mesh,
  Points,
  PointsMaterial,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from 'three';
import {
  APEX_TIME,
  COLLISION_ROTATION_AXIS_DAMPING,
  CORE_BASE_DISPLACEMENT,
  CORE_RADIUS_SCALE,
  CORONA_FADE_DURATION,
  CORONA_RADIUS_SCALE,
  DEBRIS_RADIUS_SCALE,
  DEBRIS_ROTATION_AXIS_DAMPING,
  DEBRIS_ROTATION_SPEED,
  FADE_DURATION,
  GROWTH_RATE,
  NOISE_TIME_SCALE,
  OUTER_SHELL_CONFIGS,
  ROTATION_BASE_SPIN,
  TRIGGER_GAP_SCALE,
  createCoreLayer,
  createCoronaLayer,
  createDebrisLayer,
  createOuterShells,
} from '@/modules/world-sim/infrastructure/effects/collisionCloudLayers.core';
import { computePhaseEnvelope } from '@/modules/world-sim/infrastructure/effects/collisionCloudPhase';

/**
 * Per-frame update parameters for `CollisionCloudEffect.update`. Replaces a
 * 6-positional-argument call signature with a single named-field object so
 * the meaning of each value is obvious at the call site and adding new
 * inputs (e.g. shader detail level) is non-breaking.
 *
 * @interface CollisionCloudUpdateParams
 * @property {Vector3} bodyAPosition - Current world position of body A
 * @property {Vector3} bodyBPosition - Current world position of body B
 * @property {number} bodyARadius - Surface radius of body A (world units)
 * @property {number} bodyBRadius - Surface radius of body B (world units)
 * @property {number} time - Elapsed simulation time in seconds (drives shader noise + jitter)
 * @property {number} deltaTime - Frame delta in seconds (drives phase clock + tumble)
 */
export interface CollisionCloudUpdateParams {
  bodyAPosition: Vector3;
  bodyBPosition: Vector3;
  bodyARadius: number;
  bodyBRadius: number;
  time: number;
  deltaTime: number;
}

/**
 * Proximity-driven multi-layer collision cloud centered between two
 * orbiting bodies (currently Länsihenki and Itähenki, but the effect itself
 * is body-agnostic — pair identity is injected via `pairId`). Driven by
 * surface-gap (not center distance) so the effect tightly tracks actual
 * overlap of the two bodies.
 *
 * Usage:
 * ```typescript
 * const effect = new CollisionCloudEffect('lansihenki-itahenki');
 * effect.addToScene(scene);
 * // each frame:
 * effect.update({
 *   bodyAPosition: lansPos,
 *   bodyBPosition: itaPos,
 *   bodyARadius: lansRadius,
 *   bodyBRadius: itaRadius,
 *   time,
 *   deltaTime,
 * });
 * // on dispose:
 * effect.removeFromScene(scene);
 * effect.dispose();
 * ```
 *
 * @class CollisionCloudEffect
 */
export class CollisionCloudEffect {
  /** @property {Group} group - Root group */
  private group: Group;
  /** @property {Points} debrisMesh - Debris particles */
  private debrisMesh: Points;
  /** @property {PointsMaterial} debrisMaterial - Debris material */
  private debrisMaterial: PointsMaterial;
  /** @property {Mesh} coreMesh - Opaque core (depth-writing anchor) */
  private coreMesh: Mesh;
  /** @property {ShaderMaterial} coreMaterial - Core shader */
  private coreMaterial: ShaderMaterial;
  /** @property {Mesh[]} shellMeshes - Russian-doll shells */
  private shellMeshes: Mesh[] = [];
  /** @property {ShaderMaterial[]} shellMaterials - Shell shaders */
  private shellMaterials: ShaderMaterial[] = [];
  /** @property {Mesh} coronaNearMesh - Front-facing corona pass (rim glow) */
  private coronaNearMesh: Mesh;
  /** @property {ShaderMaterial} coronaNearMaterial - Front-facing corona shader */
  private coronaNearMaterial: ShaderMaterial;
  /** @property {Mesh} coronaFarMesh - Back-facing corona pass (depthTest:false halo) */
  private coronaFarMesh: Mesh;
  /** @property {ShaderMaterial} coronaFarMaterial - Back-facing corona shader */
  private coronaFarMaterial: ShaderMaterial;
  /** @property {BufferGeometry} debrisGeometry - Debris geometry */
  private debrisGeometry: BufferGeometry;
  /** @property {SphereGeometry} coreGeometry - Core geometry */
  private coreGeometry: SphereGeometry;
  /** @property {SphereGeometry[]} shellGeometries - Shell geometries */
  private shellGeometries: SphereGeometry[] = [];
  /** @property {SphereGeometry} coronaGeometry - Corona geometry */
  private coronaGeometry: SphereGeometry;
  /** @property {number} phaseTime - Seconds since the current explosion phase was triggered. */
  private phaseTime = 0;
  /** @property {boolean} phaseActive - Whether an explosion phase is currently animating. */
  private phaseActive = false;
  /** @property {boolean} wasOutOfProximity - True once the planets have separated since the last trigger; prevents re-triggering while they remain in contact. */
  private wasOutOfProximity = true;
  /** @property {number[]} shellBaseDisplacements - Cached per-shell apex displacement values. */
  private shellBaseDisplacements: number[] = [];

  /**
   * Build the four-layer scene graph: debris points, opaque grey core,
   * russian-doll additive shells, and the corona shell. All layer geometry
   * and material construction is delegated to `collisionCloudLayers`.
   *
   * @param {string} pairId - Stable identifier for the collision pair this
   *   effect represents. Used as the scene-graph group name (so DevTools and
   *   raycast filters can locate it) and is the same id the registry exposes
   *   via `CelestialRegistry.getCollisionPair(id)`.
   */
  constructor(pairId: string) {
    this.group = new Group();
    this.group.name = `collisionCloud:${pairId}`;
    this.group.visible = false;

    const debris = createDebrisLayer();
    this.debrisGeometry = debris.geometry;
    this.debrisMaterial = debris.material;
    this.debrisMesh = debris.mesh;
    this.group.add(this.debrisMesh);

    const core = createCoreLayer();
    this.coreGeometry = core.geometry;
    this.coreMaterial = core.material;
    this.coreMesh = core.mesh;
    this.group.add(this.coreMesh);

    const shells = createOuterShells();
    for (const shell of shells) {
      this.shellGeometries.push(shell.geometry);
      this.shellMaterials.push(shell.material);
      this.shellMeshes.push(shell.mesh);
      this.shellBaseDisplacements.push(
        shell.material.uniforms.uDisplacementScale.value as number,
      );
      this.group.add(shell.mesh);
    }

    const corona = createCoronaLayer(OUTER_SHELL_CONFIGS.length + 1);
    this.coronaGeometry = corona.geometry;
    this.coronaNearMaterial = corona.nearMaterial;
    this.coronaNearMesh = corona.nearMesh;
    this.coronaFarMaterial = corona.farMaterial;
    this.coronaFarMesh = corona.farMesh;
    this.group.add(this.coronaFarMesh);
    this.group.add(this.coronaNearMesh);

    /* Pre-zero all child mesh scales so even an accidental visible frame
       before the first valid update renders nothing. */
    this.debrisMesh.scale.setScalar(0);
    this.coreMesh.scale.setScalar(0);
    this.coronaNearMesh.scale.setScalar(0);
    this.coronaFarMesh.scale.setScalar(0);
    for (const m of this.shellMeshes) {
      m.scale.setScalar(0);
    }
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
   * Update the cloud each frame. A phase clock starts the first frame the
   * planets' surfaces come within `TRIGGER_GAP_SCALE * avgRadius`, then
   * advances by `deltaTime` until the fade completes — even if the planets
   * drift apart mid-explosion the animation finishes naturally.
   *
   * Size grows logarithmically without bound (outer layers keep expanding and
   * dispersing while their alpha fades). Opacity follows a smoothstep ramp
   * up to apex and a smoothstep ramp down through fade. Jitter is a
   * high-frequency capped sinusoid scaled by live opacity so motion stays
   * alive through the entire explosion. Vertex displacement scales with
   * opacity so the core stabilizes into a smooth sphere as it fades.
   *
   * @param {CollisionCloudUpdateParams} params - Per-frame inputs (body
   *   positions, body radii, simulation time, and frame delta). See the
   *   `CollisionCloudUpdateParams` interface for field semantics.
   */
  update(params: CollisionCloudUpdateParams): void {
    const {
      bodyAPosition: lansPos,
      bodyBPosition: itaPos,
      bodyARadius: lansRadius,
      bodyBRadius: itaRadius,
      time,
      deltaTime,
    } = params;
    const dist = lansPos.distanceTo(itaPos);
    const avgRadius = (lansRadius + itaRadius) * 0.5;
    const surfaceGap = Math.max(0, dist - lansRadius - itaRadius);
    /* Require real positional separation (dist > 0). Both meshes reading
       (0,0,0) would otherwise spawn the cloud at world origin — right on
       top of Kultharja — producing a phantom "glow behind the sun". */
    const validPositions = dist > 1e-3;
    const inProximity =
      validPositions && surfaceGap < avgRadius * TRIGGER_GAP_SCALE;

    /* Require the planets to actually separate between explosions, otherwise
       a single sustained overlap would respawn the effect the moment the
       previous one finishes fading. */
    if (!inProximity) {
      this.wasOutOfProximity = true;
    }
    if (inProximity && this.wasOutOfProximity && !this.phaseActive) {
      this.phaseActive = true;
      this.phaseTime = 0;
      this.wasOutOfProximity = false;
    }
    if (this.phaseActive) {
      this.phaseTime += deltaTime;
    }

    const totalDuration = APEX_TIME + FADE_DURATION;
    if (!this.phaseActive || this.phaseTime >= totalDuration) {
      this.phaseActive = false;
      this.phaseTime = 0;
      this.group.visible = false;
      return;
    }

    const { opacity, sizeNorm } = computePhaseEnvelope(
      this.phaseTime,
      APEX_TIME,
      FADE_DURATION,
      GROWTH_RATE,
    );

    this.group.visible = true;
    this.group.position.lerpVectors(lansPos, itaPos, 0.5);

    /* Smooth rotation: each axis advances at a constant rate (a fraction of
       ROTATION_BASE_SPIN) so the explosion tumbles steadily without the
       jittery speed-up/slow-down that the |sin|-driven term used to add.
       Accumulate via deltaTime so framerate doesn't change the visual rate. */
    this.group.rotation.x +=
      ROTATION_BASE_SPIN * COLLISION_ROTATION_AXIS_DAMPING.x * deltaTime;
    this.group.rotation.y +=
      ROTATION_BASE_SPIN * COLLISION_ROTATION_AXIS_DAMPING.y * deltaTime;
    this.group.rotation.z +=
      ROTATION_BASE_SPIN * COLLISION_ROTATION_AXIS_DAMPING.z * deltaTime;

    /* Displacement is full at the start (jagged debris) and collapses to a
       smooth sphere over the fade. Pre-apex: 100%. Post-apex: linear ramp
       to 0. The core fades through alpha (uOpacity), not displacement. */
    const postApexT =
      this.phaseTime <= APEX_TIME
        ? 0
        : Math.min(1, (this.phaseTime - APEX_TIME) / FADE_DURATION);
    const displacementEnvelope = 1 - postApexT;
    /* Boost shader-time so all noise-driven vertex displacement scrolls
       faster than wall-clock without affecting the phase clock. */
    const shaderTime = time * NOISE_TIME_SCALE;
    this.coreMesh.scale.setScalar(sizeNorm * avgRadius * CORE_RADIUS_SCALE);
    this.coreMaterial.uniforms.uTime.value = shaderTime;
    this.coreMaterial.uniforms.uDisplacementScale.value =
      CORE_BASE_DISPLACEMENT * displacementEnvelope;
    this.coreMaterial.uniforms.uOpacity.value = opacity;
    /* While the core is mostly opaque it anchors depth so additive shells
       don't z-fight each other. Once it's faded below ~0.5, stop writing
       depth so the shells behind it aren't clipped by a near-invisible plane. */
    this.coreMaterial.depthWrite = opacity > 0.5;

    this.debrisMesh.scale.setScalar(sizeNorm * avgRadius * DEBRIS_RADIUS_SCALE);
    this.debrisMaterial.opacity = opacity * 0.85;
    this.debrisMesh.rotation.y +=
      DEBRIS_ROTATION_SPEED * DEBRIS_ROTATION_AXIS_DAMPING.y * deltaTime;
    this.debrisMesh.rotation.x +=
      DEBRIS_ROTATION_SPEED * DEBRIS_ROTATION_AXIS_DAMPING.x * deltaTime;

    this.coronaNearMesh.scale.setScalar(
      sizeNorm * avgRadius * CORONA_RADIUS_SCALE,
    );
    this.coronaFarMesh.scale.setScalar(
      sizeNorm * avgRadius * CORONA_RADIUS_SCALE,
    );
    /* Corona uses a shorter fade window than the rest of the explosion so it
       fully dissipates ~CORONA_FADE_LEAD seconds earlier. Recomputing the
       phase envelope with the smaller window gives an independent opacity
       curve without disturbing the master timing used by core/shells. */
    const coronaPhase = computePhaseEnvelope(
      this.phaseTime,
      APEX_TIME,
      CORONA_FADE_DURATION,
      GROWTH_RATE,
    );
    const coronaFadeT =
      this.phaseTime <= APEX_TIME
        ? 0
        : Math.min(1, (this.phaseTime - APEX_TIME) / CORONA_FADE_DURATION);
    /* Intensity multiplier bumped 2.4 → 3.2 so the corona reads as slightly
       more opaque. The inward fade (uFadeT) erases the outermost rim first,
       and noise-driven colour/alpha jitter keeps it from looking uniform. */
    this.coronaNearMaterial.uniforms.uIntensity.value =
      coronaPhase.opacity * 3.2;
    this.coronaFarMaterial.uniforms.uIntensity.value =
      coronaPhase.opacity * 3.2;
    this.coronaNearMaterial.uniforms.uFadeT.value = coronaFadeT;
    this.coronaFarMaterial.uniforms.uFadeT.value = coronaFadeT;
    this.coronaNearMaterial.uniforms.uTime.value = shaderTime;
    this.coronaFarMaterial.uniforms.uTime.value = shaderTime;

    for (let i = 0; i < this.shellMeshes.length; i++) {
      const cfg = OUTER_SHELL_CONFIGS[i];
      this.shellMeshes[i].scale.setScalar(
        sizeNorm * avgRadius * cfg.radiusScale,
      );
      const mat = this.shellMaterials[i];
      mat.uniforms.uAlpha.value = opacity * cfg.opacity;
      mat.uniforms.uTime.value = shaderTime;
      mat.uniforms.uDisplacementScale.value =
        this.shellBaseDisplacements[i] * opacity;
    }
  }

  /**
   * Dispose of all GPU resources. Call `removeFromScene` first.
   */
  dispose(): void {
    this.debrisGeometry.dispose();
    this.coreGeometry.dispose();
    this.coronaGeometry.dispose();
    for (const g of this.shellGeometries) {
      g.dispose();
    }
    this.debrisMaterial.dispose();
    this.coreMaterial.dispose();
    this.coronaNearMaterial.dispose();
    this.coronaFarMaterial.dispose();
    for (const m of this.shellMaterials) {
      m.dispose();
    }
  }
}
