/**
 * @fileoverview CollisionCloudEffect Unit Tests
 * @description Tests group construction, proximity influence, midpoint positioning,
 * scale/opacity driving, and resource disposal.
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

describe('CollisionCloudEffect', () => {
  let effect: CollisionCloudEffect;
  let scene: Scene;

  afterEach(() => {
    effect?.dispose();
  });

  it('creates a group named "collisionCloud:lansihenki-itahenki"', () => {
    effect = new CollisionCloudEffect();
    expect(effect['group'].name).toBe('collisionCloud:lansihenki-itahenki');
  });

  it('group has exactly three children (debris, cloud, corona)', () => {
    effect = new CollisionCloudEffect();
    expect(effect['group'].children).toHaveLength(3);
  });

  it('group starts at scale 0 (invisible until first update)', () => {
    effect = new CollisionCloudEffect();
    expect(effect['group'].scale.x).toBe(0);
  });

  it('addToScene adds group to scene', () => {
    effect = new CollisionCloudEffect();
    scene = new Scene();
    effect.addToScene(scene);
    expect(scene.children).toContain(effect['group']);
  });

  it('removeFromScene removes group from scene', () => {
    effect = new CollisionCloudEffect();
    scene = new Scene();
    effect.addToScene(scene);
    effect.removeFromScene(scene);
    expect(scene.children).not.toContain(effect['group']);
  });

  it('update positions group at midpoint of the two bodies', () => {
    effect = new CollisionCloudEffect();
    const a = new Vector3(0, 0, 0);
    const b = new Vector3(100, 0, 0);
    effect.update(a, b, 0, 0.016);
    expect(effect['group'].position.x).toBeCloseTo(50);
    expect(effect['group'].position.y).toBeCloseTo(0);
  });

  it('update sets scale to 0 when bodies are beyond MAX_INFLUENCE_DISTANCE', () => {
    effect = new CollisionCloudEffect();
    const a = new Vector3(0, 0, 0);
    const b = new Vector3(900, 0, 0); // exactly at threshold — raw=0
    effect.update(a, b, 0, 0.016);
    expect(effect['group'].scale.x).toBeCloseTo(0);
  });

  it('update sets scale > 0 when bodies are within MAX_INFLUENCE_DISTANCE', () => {
    effect = new CollisionCloudEffect();
    const a = new Vector3(0, 0, 0);
    const b = new Vector3(400, 0, 0); // well within 900
    effect.update(a, b, 0, 0.016);
    expect(effect['group'].scale.x).toBeGreaterThan(0);
  });

  it('update advances cloud uTime uniform', () => {
    effect = new CollisionCloudEffect();
    const a = new Vector3(0, 0, 0);
    const b = new Vector3(400, 0, 0);
    effect.update(a, b, 5.0, 0.016);
    expect(effect['cloudMaterial'].uniforms.uTime.value).toBe(5.0);
  });

  it('dispose does not throw', () => {
    effect = new CollisionCloudEffect();
    expect(() => effect.dispose()).not.toThrow();
  });
});
