/**
 * @fileoverview Guards the `.glsl` import pipeline itself, deliberately unmocked.
 *
 * Every renderer suite stubs its shader modules with `vi.mock`, so none of them
 * can observe what the bundler actually hands back. When the Next 16 migration
 * swapped webpack's `asset/source` for Turbopack's `type: 'raw'`, all 25 shaders
 * resolved to `undefined`, every `ShaderMaterial` failed to compile, and the
 * suite stayed green. These assertions are the ones that fail in that case.
 *
 * A truthiness or non-empty check is not enough: Vite's asset path and
 * Turbopack's `type: 'asset'` both resolve a shader to a URL string, which
 * passes any such check. The source must be identified by its GLSL contents.
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
