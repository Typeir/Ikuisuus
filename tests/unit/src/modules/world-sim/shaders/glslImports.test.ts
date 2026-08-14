/**
 * @fileoverview Asserts bundled `.glsl` imports resolve to raw shader source strings, not URLs, paths, or `undefined`.
 *
 * @module tests/unit/modules/world-sim/shaders/glslImports
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-08
 */

import noise3d from '@/modules/world-sim/shaders/noise3d.glsl';
import pixelateFrag from '@/modules/world-sim/shaders/pixelate.frag.glsl';
import starFrag from '@/modules/world-sim/shaders/star.frag.glsl';
import starVert from '@/modules/world-sim/shaders/star.vert.glsl';
import { describe, expect, it } from 'vitest';

const shaders = [
  {
    name: 'noise3d.glsl',
    source: noise3d,
    tokens: ['float snoise(vec3 v)', 'vec4 permute(vec4 x)'],
  },
  {
    name: 'star.vert.glsl',
    source: starVert,
    tokens: ['uniform float uTime;', 'void main()'],
  },
  {
    name: 'star.frag.glsl',
    source: starFrag,
    tokens: ['uniform vec3 uEmissiveColor;', 'void main()'],
  },
  {
    name: 'pixelate.frag.glsl',
    source: pixelateFrag,
    tokens: ['uniform sampler2D uTexture;', 'void main()'],
  },
];

describe('glsl imports', () => {
  it.each(shaders)('$name resolves to a string', ({ source }) => {
    expect(typeof source).toBe('string');
  });

  it.each(shaders)('$name carries its GLSL declarations', ({
    source,
    tokens,
  }) => {
    for (const token of tokens) {
      expect(source).toContain(token);
    }
  });

  it.each(shaders)('$name is source rather than a URL or path', ({
    source,
  }) => {
    expect(source.length).toBeGreaterThan(200);
    expect(source).not.toMatch(/^\/[^\n]*\.glsl$/);
  });
});
