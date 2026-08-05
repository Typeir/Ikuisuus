/**
 * @fileoverview Aspect Extractor Tests
 * @description Covers the derivations that turn prose and structured fields into
 * aspects, with the damage strata as the focus: they are inferred from the types
 * already present rather than authored, so a mistake here silently mislabels
 * every record carrying that type.
 *
 * @module tests/unit/scripts/metadata/aspectExtractors
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-04
 *
 * @requires vitest Testing framework
 */

import { extractStrataTags } from '@scripts/metadata/aspectExtractors';
import {
  loadSharedData,
  type SharedData,
} from '@scripts/metadata/sharedData';
import { beforeAll, describe, expect, it } from 'vitest';

describe('extractStrataTags', () => {
  let sharedData: SharedData;

  beforeAll(async () => {
    sharedData = await loadSharedData();
  });

  it('should derive the stratum a damage type belongs to', () => {
    expect(extractStrataTags(['damage:fire'], sharedData)).toEqual([
      'damage:elemental',
    ]);
  });

  it('should derive strata for each scoped defence', () => {
    const result = extractStrataTags(
      ['resistance:frost', 'immunity:poison', 'vulnerability:holy'],
      sharedData,
    );

    expect(result).toContain('resistance:elemental');
    expect(result).toContain('immunity:somatic');
    expect(result).toContain('vulnerability:akashic');
  });

  it('should collapse several types of one stratum into a single aspect', () => {
    const result = extractStrataTags(
      ['immunity:chemical', 'immunity:poison', 'immunity:psychic'],
      sharedData,
    );

    expect(result).toEqual(['immunity:somatic']);
  });

  it('should keep a group from bleeding into another', () => {
    const result = extractStrataTags(
      ['damage:fire', 'resistance:slashing'],
      sharedData,
    );

    expect(result).toContain('damage:elemental');
    expect(result).toContain('resistance:physical');
    expect(result).not.toContain('damage:physical');
    expect(result).not.toContain('resistance:elemental');
  });

  /**
   * True damage stands outside every stratum: it cannot be resisted, reduced or
   * avoided, so giving it one would imply a defence that does not exist.
   */
  it('should give true damage no stratum', () => {
    expect(extractStrataTags(['damage:true'], sharedData)).toEqual([]);
  });

  it('should ignore groups that have no strata', () => {
    expect(
      extractStrataTags(['condition:prone', 'tempo:major'], sharedData),
    ).toEqual([]);
  });

  it('should be idempotent, so repeated passes cannot compound', () => {
    const once = extractStrataTags(['damage:fire'], sharedData);
    const twice = extractStrataTags(['damage:fire', ...once], sharedData);

    expect(twice.sort()).toEqual(once.sort());
  });

  /** Every stratum member must be a real damage type, or nothing will match it. */
  it('should stratify every damage type except true', () => {
    const strata = sharedData.gameData.damageStrata ?? {};
    const stratified = new Set(Object.values(strata).flat());

    const unstratified = sharedData.gameData.damageTypes.filter(
      (type) => type !== 'true' && !stratified.has(type),
    );

    expect(unstratified).toEqual([]);
  });

  it('should not place a type in more than one stratum', () => {
    const strata = sharedData.gameData.damageStrata ?? {};
    const seen = new Map<string, string>();
    const duplicates: string[] = [];

    for (const [stratum, types] of Object.entries(strata)) {
      for (const type of types) {
        const previous = seen.get(type);
        if (previous) duplicates.push(`${type}: ${previous} and ${stratum}`);
        else seen.set(type, stratum);
      }
    }

    expect(duplicates).toEqual([]);
  });
});
