/**
 * @fileoverview Unit tests for useEncounterIO
 * @module tests/unit/src/modules/encounter-planner/presentation/EncounterPlanner/useEncounterIO.test
 * @version 1.0.0
 * @author Typeir
 */

import * as Module from '@/modules/encounter-planner/presentation/EncounterPlanner/useEncounterIO';
import { describe, expect, it } from 'vitest';

describe('useEncounterIO module', () => {
  it('should export useEncounterIO', () => {
    expect(Module).toBeDefined();
  });
});
