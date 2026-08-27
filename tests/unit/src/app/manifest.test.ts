/**
 * Web App Manifest Tests
 *
 * @fileoverview Covers the fields that decide whether an installed instance
 * drops the browser chrome.
 */

import manifest from '@/app/manifest';
import { describe, expect, it } from 'vitest';

describe('manifest', () => {
  it('should request standalone display so installed instances lose the address bar', () => {
    expect(manifest().display).toBe('standalone');
  });

  it('should list standalone first in the display override chain', () => {
    expect(manifest().display_override?.[0]).toBe('standalone');
  });

  it('should scope the app to the site root', () => {
    const result = manifest();

    expect(result.start_url).toBe('/');
    expect(result.scope).toBe('/');
  });

  it('should ship an installable icon', () => {
    const [icon] = manifest().icons ?? [];

    expect(icon?.src).toBe('/logo.png');
    expect(icon?.type).toBe('image/png');
  });
});
