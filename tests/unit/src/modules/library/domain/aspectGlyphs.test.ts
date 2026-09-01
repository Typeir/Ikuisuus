/**
 * @fileoverview Aspect Glyph Table Tests
 * @description Guards the glyph tables themselves — that every condition the
 * rules define has a mark, and that the tables stay in step with the closed
 * vocabulary in shared data.
 *
 * A missing entry is silent: the value falls back to its group's glyph and looks
 * like every other value in that group, which is indistinguishable from working.
 *
 * @module tests/unit/src/modules/library/domain/aspectGlyphs.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-04
 *
 * @requires vitest Testing framework
 */

import {
  CONDITION_MARK,
  DAMAGE_ICON,
  FALLBACK_ICON,
  GROUP_ICON,
  SCOPED_DEFENCE,
  SEVERITY_BADGE,
} from '@/modules/library/domain/aspectGlyphs';
import { readFile } from 'fs/promises';
import path from 'path';
import { beforeAll, describe, expect, it } from 'vitest';

interface SharedData {
  gameData: { conditions: string[]; damageTypes: string[] };
}

describe('aspect glyph tables', () => {
  let shared: SharedData;

  beforeAll(async () => {
    const raw = await readFile(
      path.resolve(process.cwd(), 'scripts', 'core', 'shared-data.json'),
      'utf8',
    );
    shared = JSON.parse(raw) as SharedData;
  });

  /**
   * Conditions are the group a reader meets most often, and the one where a
   * fallback is least tolerable — nine condition immunities on one stat block
   * would all draw the same mark.
   */
  it('should give every condition in shared data its own mark', () => {
    const missing = shared.gameData.conditions.filter(
      (condition) => !CONDITION_MARK[condition],
    );

    expect(missing).toEqual([]);
  });

  it('should not map a condition shared data does not define', () => {
    const unknown = Object.keys(CONDITION_MARK).filter(
      (condition) => !shared.gameData.conditions.includes(condition),
    );

    expect(unknown).toEqual([]);
  });

  it('should give every damage type its own glyph', () => {
    const missing = shared.gameData.damageTypes.filter(
      (type) => !DAMAGE_ICON[type],
    );

    expect(missing).toEqual([]);
  });

  it('should draw each condition with a distinct glyph', () => {
    const seen = new Map<string, string>();
    const collisions: string[] = [];

    for (const [condition, mark] of Object.entries(CONDITION_MARK)) {
      const name = mark.Icon.displayName ?? mark.Icon.name;
      const previous = seen.get(name);
      if (previous) collisions.push(`${previous} / ${condition} share ${name}`);
      else seen.set(name, condition);
    }

    expect(collisions).toEqual([]);
  });

  it('should escalate severity badges from none to two chevrons', () => {
    expect(SEVERITY_BADGE.base).toBeUndefined();
    expect(SEVERITY_BADGE.worse).toBeDefined();
    expect(SEVERITY_BADGE.worst).toBeDefined();
    expect(SEVERITY_BADGE.worse).not.toBe(SEVERITY_BADGE.worst);
  });

  it('should provide a modifier for each scoped defence group', () => {
    for (const group of ['resistance', 'immunity', 'vulnerability']) {
      expect(SCOPED_DEFENCE[group]).toBeDefined();
    }
  });

  it('should expose a fallback glyph for undrawn groups', () => {
    expect(FALLBACK_ICON).toBeDefined();
    expect(GROUP_ICON.damage).toBeDefined();
  });
});
