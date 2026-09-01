/**
 * @fileoverview Unit tests for collisionCoronaShaders inline GLSL strings.
 *
 * @module tests/unit/src/modules/world-sim/infrastructure/effects/collisionCoronaShaders.test
 */

import {
    CORONA_FRAG,
    CORONA_VERT,
} from '@/modules/world-sim/infrastructure/effects/collisionCoronaShaders';
import { describe, expect, it } from 'vitest';

describe('collisionCoronaShaders', () => {
  it('CORONA_VERT declares the expected uniforms and varyings', () => {
    expect(CORONA_VERT).toContain('uniform float uTime;');
    expect(CORONA_VERT).toContain('uniform float uNoiseScale;');
    expect(CORONA_VERT).toContain('varying vec3 vNormal;');
    expect(CORONA_VERT).toContain('varying float vNoise;');
    expect(CORONA_VERT).toContain('void main()');
  });

  it('CORONA_VERT samples multi-octave snoise (relies on noise3d.glsl)', () => {
    const occurrences = CORONA_VERT.match(/snoise\(/g) ?? [];
    expect(occurrences.length).toBeGreaterThanOrEqual(3);
  });

  it('CORONA_FRAG declares the inward-fade and noise-tint uniforms', () => {
    expect(CORONA_FRAG).toContain('uniform vec3 uColor;');
    expect(CORONA_FRAG).toContain('uniform vec3 uSecondaryColor;');
    expect(CORONA_FRAG).toContain('uniform float uIntensity;');
    expect(CORONA_FRAG).toContain('uniform float uFadeT;');
  });

  it('CORONA_FRAG composes alpha from rim, intensity, noise, and fadeMask', () => {
    expect(CORONA_FRAG).toMatch(/float alpha\s*=\s*rimRaw\s*\*\s*uIntensity/);
    expect(CORONA_FRAG).toContain('noiseAlpha');
    expect(CORONA_FRAG).toContain('fadeMask');
  });

  it('CORONA_FRAG uses uFadeT to attenuate the outer rim first', () => {
    expect(CORONA_FRAG).toMatch(/1\.0\s*-\s*uFadeT\s*\*\s*rimNorm/);
  });
});
