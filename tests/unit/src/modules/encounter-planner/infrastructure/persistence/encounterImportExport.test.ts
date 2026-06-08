/**
 * @fileoverview Tests for encounter import/export utilities
 * @module tests/encounter-planner/infrastructure/persistence/encounterImportExport
 */

import type { Encounter } from '@/modules/encounter-planner/domain/encounters/encounter.types';
import {
    exportEncounter,
    importEncounter,
} from '@/modules/encounter-planner/infrastructure/persistence/encounterImportExport';
import { describe, expect, it } from 'vitest';

const BASE_ENCOUNTER: Encounter = {
  id: 'test-id-1',
  name: 'Test Encounter',
  creatures: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('exportEncounter', () => {
  it('serializes encounter to formatted JSON', () => {
    const json = exportEncounter(BASE_ENCOUNTER);
    expect(json).toContain('"id": "test-id-1"');
    expect(json).toContain('"name": "Test Encounter"');
  });

  it('uses 2-space indentation', () => {
    const json = exportEncounter(BASE_ENCOUNTER);
    expect(json).toContain('\n  "id"');
  });

  it('round-trips without data loss', () => {
    const json = exportEncounter(BASE_ENCOUNTER);
    const parsed = JSON.parse(json) as Encounter;
    expect(parsed.name).toBe(BASE_ENCOUNTER.name);
    expect(parsed.creatures).toEqual([]);
  });
});

describe('importEncounter', () => {
  it('parses valid encounter JSON and assigns a new ID', () => {
    const json = exportEncounter(BASE_ENCOUNTER);
    const imported = importEncounter(json);
    expect(imported.name).toBe('Test Encounter');
    expect(imported.id).not.toBe('test-id-1');
  });

  it('throws on invalid JSON', () => {
    expect(() => importEncounter('{invalid json')).toThrow();
  });

  it('throws if name is missing', () => {
    const bad = JSON.stringify({ id: 'x', creatures: [] });
    expect(() => importEncounter(bad)).toThrow('Invalid encounter structure');
  });

  it('throws if creatures is missing', () => {
    const bad = JSON.stringify({ id: 'x', name: 'Y' });
    expect(() => importEncounter(bad)).toThrow('Invalid encounter structure');
  });

  it('sets updatedAt to current time', () => {
    const before = new Date().toISOString();
    const json = exportEncounter(BASE_ENCOUNTER);
    const imported = importEncounter(json);
    expect(imported.updatedAt >= before).toBe(true);
  });
});
