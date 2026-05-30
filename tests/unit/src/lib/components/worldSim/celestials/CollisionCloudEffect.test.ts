/**
 * @fileoverview CollisionCloudEffect Unit Tests
 * @description Tests group construction, surface-gap proximity influence,
 * midpoint positioning, per-layer scaling, and resource disposal.
 *
 * @module tests/unit/worldSim/celestials/CollisionCloudEffect
 */

import { CollisionCloudEffect } from '@/lib/components/worldSim/celestials/CollisionCloudEffect';
import { Scene, Vector3 } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

/** Mock all GLSL imports */
vi.mock('@/lib/components/worldSim/shaders/atmosphere.frag.glsl', () => ({
  default: 'void main() {}',
}));
vi.mock('@/lib/components/worldSim/shaders/atmosphere.vert.glsl', () => ({
  default: 'void main() {}',
}));
vi.mock('@/lib/components/worldSim/shaders/noise3d.glsl', () => ({
  default: '',
}));
vi.mock('@/lib/components/worldSim/shaders/collisionCloud.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0.0); }',
}));
vi.mock('@/lib/components/worldSim/shaders/collisionCloud.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1.0); }',
}));
vi.mock('@/lib/components/worldSim/shaders/collisionCore.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0.0); }',
}));
vi.mock('@/lib/components/worldSim/shaders/collisionCore.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1.0); }',
}));

const LANS_R = 87;
const ITA_R = 82;
const SUM_R = LANS_R + ITA_R; // 169 — exact contact distance
const PAIR_ID = 'lansihenki-itahenki';

/**
 * Build a minimal `CollisionCloudUpdateParams` object for tests.
 */
const params = (
  a: Vector3,
  b: Vector3,
  time: number,
  deltaTime: number,
  ar = LANS_R,
  br = ITA_R,
) => ({
  bodyAPosition: a,
  bodyBPosition: b,
  bodyARadius: ar,
  bodyBRadius: br,
  time,
  deltaTime,
});

describe('CollisionCloudEffect', () => {
  let effect: CollisionCloudEffect;
  let scene: Scene;

  afterEach(() => {
    effect?.dispose();
  });

  it('creates a group named "collisionCloud:<pairId>" from the injected pair id', () => {
    effect = new CollisionCloudEffect(PAIR_ID);
    expect(effect['group'].name).toBe(`collisionCloud:${PAIR_ID}`);
  });

  it('uses the injected pair id verbatim (no hardcoded body names)', () => {
    effect = new CollisionCloudEffect('alpha-beta');
    expect(effect['group'].name).toBe('collisionCloud:alpha-beta');
  });

  it('group contains debris, opaque core, three outer shells, and corona', () => {
    effect = new CollisionCloudEffect(PAIR_ID);
    const names = effect['group'].children.map((c) => c.name);
    expect(names).toContain('collisionCloud-debris');
    expect(names).toContain('collisionCloud-core');
    expect(names).toContain('collisionCloud-shell-1');
    expect(names).toContain('collisionCloud-shell-2');
    expect(names).toContain('collisionCloud-shell-3');
    expect(names).toContain('collisionCloud-corona-near');
    expect(names).toContain('collisionCloud-corona-far');
  });

  it('group starts hidden (invisible until first update with overlap)', () => {
    effect = new CollisionCloudEffect(PAIR_ID);
    expect(effect['group'].visible).toBe(false);
  });

  it('addToScene adds group to scene', () => {
    effect = new CollisionCloudEffect(PAIR_ID);
    scene = new Scene();
    effect.addToScene(scene);
    expect(scene.children).toContain(effect['group']);
  });

  it('removeFromScene removes group from scene', () => {
    effect = new CollisionCloudEffect(PAIR_ID);
    scene = new Scene();
    effect.addToScene(scene);
    effect.removeFromScene(scene);
    expect(scene.children).not.toContain(effect['group']);
  });

  it('update positions group at midpoint of the two bodies', () => {
    effect = new CollisionCloudEffect(PAIR_ID);
    const a = new Vector3(0, 0, 0);
    const b = new Vector3(SUM_R, 0, 0); // exact contact
    effect.update(params(a, b, 0, 0.016));
    expect(effect['group'].position.x).toBeCloseTo(SUM_R / 2);
    expect(effect['group'].position.y).toBeCloseTo(0);
  });

  it('group is hidden when planets are clearly separated (no overlap)', () => {
    effect = new CollisionCloudEffect(PAIR_ID);
    const a = new Vector3(0, 0, 0);
    const b = new Vector3(900, 0, 0);
    effect.update(params(a, b, 0, 0.016));
    expect(effect['group'].visible).toBe(false);
  });

  it('group is visible at the moment of surface contact', () => {
    effect = new CollisionCloudEffect(PAIR_ID);
    const a = new Vector3(0, 0, 0);
    const b = new Vector3(SUM_R, 0, 0); // surfaceGap = 0 → influence = 1
    effect.update(params(a, b, 0, 0.016));
    expect(effect['group'].visible).toBe(true);
    expect(effect['coreMesh'].scale.x).toBeGreaterThan(0);
  });

  it('group is hidden once surface gap exceeds trigger threshold', () => {
    effect = new CollisionCloudEffect(PAIR_ID);
    const avgR = (LANS_R + ITA_R) / 2; // 84.5
    const a = new Vector3(0, 0, 0);
    /* Push the planets apart by TRIGGER_GAP_SCALE * avgR of clear sky → not in proximity */
    const triggerGap = avgR * 1.0; // matches TRIGGER_GAP_SCALE in the source
    const b = new Vector3(SUM_R + triggerGap + 1, 0, 0);
    effect.update(params(a, b, 0, 0.016));
    expect(effect['group'].visible).toBe(false);
  });

  it('phase animation continues even after planets separate mid-explosion', () => {
    effect = new CollisionCloudEffect(PAIR_ID);
    const a = new Vector3(0, 0, 0);
    /* Trigger phase at contact */
    effect.update(params(a, new Vector3(SUM_R, 0, 0), 0, 0.016));
    /* Pull apart; phase clock should keep ticking through the fade */
    effect.update(params(a, new Vector3(900, 0, 0), 0.1, 0.5));
    expect(effect['group'].visible).toBe(true);
  });

  it('outer layers (debris) grow monotonically across frames during the phase', () => {
    effect = new CollisionCloudEffect(PAIR_ID);
    const a = new Vector3(0, 0, 0);
    const b = new Vector3(SUM_R, 0, 0);
    effect.update(params(a, b, 0, 0.05));
    const earlyDebris = effect['debrisMesh'].scale.x;
    effect.update(params(a, b, 0.1, 0.5));
    const laterDebris = effect['debrisMesh'].scale.x;
    expect(laterDebris).toBeGreaterThan(earlyDebris);
  });

  it('core fades through alpha as the explosion dissipates', async () => {
    const { APEX_TIME, FADE_DURATION } =
      await import('@/lib/components/worldSim/celestials/collisionCloudLayers');
    effect = new CollisionCloudEffect(PAIR_ID);
    const a = new Vector3(0, 0, 0);
    const b = new Vector3(SUM_R, 0, 0);
    /* Drive exactly to apex */
    effect.update(params(a, b, 0, APEX_TIME));
    const apexOpacity = effect['coreMaterial'].uniforms.uOpacity
      .value as number;
    /* Advance ~80% of the way through the fade window */
    effect.update(params(a, b, 0, FADE_DURATION * 0.8));
    const fadingOpacity = effect['coreMaterial'].uniforms.uOpacity
      .value as number;
    expect(apexOpacity).toBeGreaterThan(0.9);
    expect(fadingOpacity).toBeLessThan(apexOpacity);
    expect(fadingOpacity).toBeLessThan(0.3);
  });

  it('opaque core is the only depth-writing surface in the stack', () => {
    effect = new CollisionCloudEffect(PAIR_ID);
    const core = effect['coreMaterial'];
    expect(core.depthWrite).toBe(true);
    for (const shell of effect['shellMaterials']) {
      expect(shell.depthWrite).toBe(false);
      expect(shell.transparent).toBe(true);
    }
  });

  it('update advances shader uTime uniforms (scaled by NOISE_TIME_SCALE)', () => {
    effect = new CollisionCloudEffect(PAIR_ID);
    const a = new Vector3(0, 0, 0);
    const b = new Vector3(SUM_R, 0, 0);
    effect.update(params(a, b, 5.0, 0.016));
    /* shaderTime = time * NOISE_TIME_SCALE = 5.0 * 1.5 = 7.5 */
    expect(effect['coreMaterial'].uniforms.uTime.value).toBe(7.5);
    expect(effect['shellMaterials'][0].uniforms.uTime.value).toBe(7.5);
  });

  it('dispose does not throw', () => {
    effect = new CollisionCloudEffect(PAIR_ID);
    expect(() => effect.dispose()).not.toThrow();
  });
});
