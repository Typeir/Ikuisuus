/**
 * @fileoverview CelestialBodyFactory Unit Tests
 * @description Tests factory creation for all 7 renderer types and error
 * handling for unknown types.
 *
 * @module tests/unit/worldSim/celestials/CelestialBodyFactory
 */

import { CelestialBodyFactory } from '@/modules/world-sim/infrastructure/geometry/factories/CelestialBodyFactory';
import type { CelestialRendererType } from '@/modules/world-sim/domain/celestials/celestialBody.types';
import { describe, expect, it, vi } from 'vitest';

/** Mock GLSL shader imports used by EverdarkRenderer and PlanetRenderer */
vi.mock('@/modules/world-sim/shaders/everdark.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(0.0); }',
}));
vi.mock('@/modules/world-sim/shaders/everdark.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0.0); }',
}));
vi.mock('@/modules/world-sim/shaders/noise3d.glsl', () => ({
  default: '/* noise stub */',
}));
vi.mock('@/modules/world-sim/shaders/atmosphere.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(0.0); }',
}));
vi.mock('@/modules/world-sim/shaders/atmosphere.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0.0); }',
}));
vi.mock('@/modules/world-sim/shaders/star.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0.0); }',
}));
vi.mock('@/modules/world-sim/shaders/star.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1.0); }',
}));
vi.mock('@/modules/world-sim/shaders/planet.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0.0); }',
}));
vi.mock('@/modules/world-sim/shaders/planet.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1.0); }',
}));
vi.mock('@/modules/world-sim/shaders/gasGiant.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0.0); }',
}));
vi.mock('@/modules/world-sim/shaders/gasGiant.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1.0); }',
}));
vi.mock('@/modules/world-sim/shaders/icyCore.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0.0); }',
}));
vi.mock('@/modules/world-sim/shaders/icyCore.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1.0); }',
}));
vi.mock('@/modules/world-sim/shaders/ringWorld.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0.0); }',
}));
vi.mock('@/modules/world-sim/shaders/ringWorld.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1.0); }',
}));
vi.mock('@/modules/world-sim/shaders/tower.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0.0); }',
}));
vi.mock('@/modules/world-sim/shaders/tower.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1.0); }',
}));

/** Mock CelestialGlow to avoid canvas dependency */
vi.mock('@/modules/world-sim/infrastructure/effects/CelestialGlow', () => ({
  createRadialGradientTexture: () => ({ isTexture: true, dispose: vi.fn() }),
  createCelestialGlow: () => {
    const { Object3D } = require('three');
    const s = new Object3D();
    s.name = 'celestial-glow';
    return s;
  },
}));

describe('CelestialBodyFactory', () => {
  const allTypes: CelestialRendererType[] = [
    'star',
    'planet',
    'gasGiant',
    'ringWorld',
    'towerWorld',
    'asteroidBelt',
    'everdark',
  ];

  it.each(allTypes)('creates a renderer for type "%s"', (type) => {
    const renderer = CelestialBodyFactory.createRenderer(type);
    expect(renderer).toBeDefined();
    expect(typeof renderer.createMesh).toBe('function');
    expect(typeof renderer.update).toBe('function');
    expect(typeof renderer.dispose).toBe('function');
  });

  it('throws for unknown renderer type', () => {
    expect(() => {
      CelestialBodyFactory.createRenderer('unicorn' as CelestialRendererType);
    }).toThrow(/Unknown celestial renderer type/);
  });

  it('error message lists valid types', () => {
    try {
      CelestialBodyFactory.createRenderer('invalid' as CelestialRendererType);
    } catch (e: any) {
      expect(e.message).toContain('star');
      expect(e.message).toContain('everdark');
    }
  });

  it('each call returns a fresh instance', () => {
    const a = CelestialBodyFactory.createRenderer('planet');
    const b = CelestialBodyFactory.createRenderer('planet');
    expect(a).not.toBe(b);
  });
});
