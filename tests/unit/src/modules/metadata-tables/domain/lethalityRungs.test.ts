/**
 * @fileoverview Unit tests for the Lethality ladder.
 *
 * @module tests/unit/src/modules/metadata-tables/domain/lethalityRungs.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-12
 */

import { describe, expect, it } from 'vitest';
import { XP_BY_LETHALITY } from '@/modules/library/domain/derive';
import { buildLethalityRungs } from '@/modules/metadata-tables/domain/lethalityRungs';

describe('buildLethalityRungs', () => {
  it('writes every rung the domain knows, in rating order', () => {
    const rungs = buildLethalityRungs([]);
    expect(rungs).toHaveLength(XP_BY_LETHALITY.length);
    expect(rungs.map((rung) => rung.rating)).toEqual(
      XP_BY_LETHALITY.map(([rating]) => rating),
    );
  });

  it('prices each rung off the domain ladder', () => {
    const rungs = buildLethalityRungs([]);
    const seventeen = rungs.find((rung) => rung.rating === 17);
    expect(seventeen?.xp).toBe(18000);
    expect(seventeen?.label).toBe('17');
    expect(seventeen?.tierBonus).toBe(6);
  });

  it('writes fractional rungs the way a sheet does', () => {
    const rungs = buildLethalityRungs([]);
    expect(rungs.find((rung) => rung.rating === 0.25)?.label).toBe('1/4');
  });

  it('counts the creatures written on a rung', () => {
    const rungs = buildLethalityRungs([
      { cr: '18' },
      { cr: '18' },
      { cr: '1/4' },
    ]);
    expect(rungs.find((rung) => rung.rating === 18)?.creatures).toBe(2);
    expect(rungs.find((rung) => rung.rating === 0.25)?.creatures).toBe(1);
  });

  it('leaves a rung nothing sits on at zero', () => {
    const rungs = buildLethalityRungs([{ cr: '18' }]);
    expect(rungs.find((rung) => rung.rating === 21)?.creatures).toBe(0);
  });

  it('ignores a creature whose Lethality is missing or unreadable', () => {
    const rungs = buildLethalityRungs([{}, { cr: '' }, { cr: 'unknown' }]);
    expect(rungs.every((rung) => rung.creatures === 0)).toBe(true);
  });
});
