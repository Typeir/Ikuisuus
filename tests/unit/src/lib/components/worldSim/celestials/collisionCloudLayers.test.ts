/**
 * @fileoverview Tests for collision cloud layer factories.
 */

import {
    CORE_RADIUS_SCALE,
    CORONA_RADIUS_SCALE,
    DEBRIS_RADIUS_SCALE,
    DEBRIS_ROTATION_SPEED,
    OUTER_SHELL_CONFIGS,
    TRIGGER_GAP_SCALE,
    createCoreLayer,
    createCoronaLayer,
    createDebrisLayer,
    createOuterShells,
} from '@/lib/components/worldSim/celestials/collisionCloudLayers';
import { describe, expect, it } from 'vitest';

describe('collisionCloudLayers', () => {
  describe('constants', () => {
    it('exposes positive scale constants', () => {
      expect(TRIGGER_GAP_SCALE).toBeGreaterThan(0);
      expect(CORE_RADIUS_SCALE).toBeGreaterThan(0);
      expect(DEBRIS_RADIUS_SCALE).toBeGreaterThan(CORE_RADIUS_SCALE);
      expect(CORONA_RADIUS_SCALE).toBeGreaterThan(DEBRIS_RADIUS_SCALE);
      expect(DEBRIS_ROTATION_SPEED).toBeGreaterThan(0);
    });
  });

  describe('OUTER_SHELL_CONFIGS', () => {
    it('defines three shells with increasing radius and decreasing opacity', () => {
      expect(OUTER_SHELL_CONFIGS.length).toBe(3);
      for (let i = 1; i < OUTER_SHELL_CONFIGS.length; i++) {
        expect(OUTER_SHELL_CONFIGS[i].radiusScale).toBeGreaterThan(
          OUTER_SHELL_CONFIGS[i - 1].radiusScale,
        );
        expect(OUTER_SHELL_CONFIGS[i].opacity).toBeLessThan(
          OUTER_SHELL_CONFIGS[i - 1].opacity,
        );
      }
    });
  });

  describe('createDebrisLayer', () => {
    it('builds a Points mesh with a non-empty position attribute', () => {
      const layer = createDebrisLayer();
      expect(layer.mesh.type).toBe('Points');
      const attr = layer.geometry.getAttribute('position');
      expect(attr).toBeDefined();
      expect(attr.count).toBeGreaterThan(0);
      expect(layer.material.transparent).toBe(true);
      expect(layer.material.opacity).toBe(0);
      layer.geometry.dispose();
      layer.material.dispose();
    });
  });

  describe('createCoreLayer', () => {
    it('builds a depth-writing core mesh with alpha-driven fade', () => {
      const layer = createCoreLayer();
      expect(layer.mesh.type).toBe('Mesh');
      expect(layer.material.transparent).toBe(true);
      expect(layer.material.depthWrite).toBe(true);
      expect(layer.material.uniforms.uTime.value).toBe(0);
      expect(layer.material.uniforms.uOpacity.value).toBe(1);
      layer.geometry.dispose();
      layer.material.dispose();
    });
  });

  describe('createOuterShells', () => {
    it('builds one transparent additive shell per config', () => {
      const shells = createOuterShells();
      expect(shells.length).toBe(OUTER_SHELL_CONFIGS.length);
      for (let i = 0; i < shells.length; i++) {
        expect(shells[i].material.transparent).toBe(true);
        expect(shells[i].material.depthWrite).toBe(false);
        expect(shells[i].mesh.renderOrder).toBe(
          OUTER_SHELL_CONFIGS[i].renderOrder,
        );
        shells[i].geometry.dispose();
        shells[i].material.dispose();
      }
    });
  });

  describe('createCoronaLayer', () => {
    it('builds a two-pass additive corona (near FrontSide, far BackSide w/o depthTest)', () => {
      const layers = createCoronaLayer(99);
      expect(layers.nearMesh.renderOrder).toBe(99);
      expect(layers.farMesh.renderOrder).toBe(100);
      expect(layers.nearMaterial.transparent).toBe(true);
      expect(layers.farMaterial.transparent).toBe(true);
      expect(layers.nearMaterial.depthWrite).toBe(false);
      expect(layers.farMaterial.depthWrite).toBe(false);
      expect(layers.farMaterial.depthTest).toBe(false);
      expect(layers.nearMaterial.depthTest).toBe(true);
      layers.geometry.dispose();
      layers.nearMaterial.dispose();
      layers.farMaterial.dispose();
    });
  });
});
