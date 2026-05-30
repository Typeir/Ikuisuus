/**
 * @fileoverview shaderMaterialFactory unit tests
 */

import { createDisplacedShaderMaterial } from '@/lib/components/worldSim/celestials/shaderMaterialFactory';
import { ShaderMaterial } from 'three';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/components/worldSim/shaders/noise3d.glsl', () => ({
  default: '/* NOISE */',
}));

describe('createDisplacedShaderMaterial', () => {
  it('prepends noise snippet to the vertex shader', () => {
    const mat = createDisplacedShaderMaterial({
      vertexShader: 'void main(){}',
      fragmentShader: 'void main(){}',
      uniforms: { uTime: { value: 0 } },
    });
    expect(mat).toBeInstanceOf(ShaderMaterial);
    expect(mat.vertexShader.startsWith('/* NOISE */')).toBe(true);
    expect(mat.vertexShader).toContain('void main(){}');
  });

  it('does NOT prepend noise to the fragment shader by default', () => {
    const mat = createDisplacedShaderMaterial({
      vertexShader: 'v',
      fragmentShader: 'frag-only',
      uniforms: {},
    });
    expect(mat.fragmentShader).toBe('frag-only');
  });

  it('prepends noise to fragment when prependNoiseToFragment is true', () => {
    const mat = createDisplacedShaderMaterial({
      vertexShader: 'v',
      fragmentShader: 'frag-only',
      uniforms: {},
      prependNoiseToFragment: true,
    });
    expect(mat.fragmentShader.startsWith('/* NOISE */')).toBe(true);
    expect(mat.fragmentShader).toContain('frag-only');
  });

  it('forwards uniforms verbatim', () => {
    const uniforms = { uAlpha: { value: 0.5 } };
    const mat = createDisplacedShaderMaterial({
      vertexShader: 'v',
      fragmentShader: 'f',
      uniforms,
    });
    expect(mat.uniforms.uAlpha.value).toBe(0.5);
  });

  it('respects an override noiseSnippet', () => {
    const mat = createDisplacedShaderMaterial({
      vertexShader: 'v',
      fragmentShader: 'f',
      uniforms: {},
      noiseSnippet: '/* CUSTOM */',
    });
    expect(mat.vertexShader.startsWith('/* CUSTOM */')).toBe(true);
  });

  it('applies optional materialParams (transparent, depthWrite, blending)', () => {
    const mat = createDisplacedShaderMaterial({
      vertexShader: 'v',
      fragmentShader: 'f',
      uniforms: {},
      materialParams: { transparent: true, depthWrite: false },
    });
    expect(mat.transparent).toBe(true);
    expect(mat.depthWrite).toBe(false);
  });
});
