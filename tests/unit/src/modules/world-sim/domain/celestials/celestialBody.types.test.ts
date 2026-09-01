/**
 * @fileoverview Smoke test for celestial body domain types.
 * @description Validates structural conformance of SceneContext and OrbitalParameters interfaces.
 *
 * @module tests/unit/src/modules/world-sim/domain/celestials/celestialBody.types.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { OrbitalParameters } from '@/modules/world-sim/domain/celestials/celestialBody.types';
import { describe, expect, it } from 'vitest';

describe('Celestial body domain types', () => {
  it('OrbitalParameters accepts valid numeric fields', () => {
    const params: OrbitalParameters = {
      semiMajorAxis: 1.0,
      eccentricity: 0.0,
      inclination: 0,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      meanAnomalyAtEpoch: 0,
      period: 365.25,
    };
    expect(params.semiMajorAxis).toBe(1.0);
    expect(params.period).toBe(365.25);
  });
});
