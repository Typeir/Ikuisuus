/**
 * @fileoverview renderConfigHelpers unit tests
 */

import { extractColor } from '@/modules/world-sim/infrastructure/renderers/renderConfigHelpers';
import { Color } from 'three';
import { describe, expect, it } from 'vitest';

describe('extractColor', () => {
  it('returns a Color built from the named field when present', () => {
    const c = extractColor({ baseColor: '#ff0000' }, 'baseColor', '#000000');
    expect(c).toBeInstanceOf(Color);
    expect(c.getHexString()).toBe('ff0000');
  });

  it('falls back to defaultHex when the field is missing', () => {
    const c = extractColor({}, 'baseColor', '#00ff00');
    expect(c.getHexString()).toBe('00ff00');
  });

  it('falls back to defaultHex when the field is not a string', () => {
    const c = extractColor({ baseColor: 42 }, 'baseColor', '#0000ff');
    expect(c.getHexString()).toBe('0000ff');
  });

  it('treats an undefined config as falling back to default', () => {
    const c = extractColor(undefined, 'anything', '#aabbcc');
    expect(c.getHexString()).toBe('aabbcc');
  });
});
