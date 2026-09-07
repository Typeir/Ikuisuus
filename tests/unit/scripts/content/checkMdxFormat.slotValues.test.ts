/**
 * @fileoverview Tests for the gate's slot-value rule.
 * @description The cards derive from slot values without complaint, so the
 * gate is the one place a value of the wrong shape is named.
 *
 * @module tests/unit/scripts/content/checkMdxFormat.slotValues.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-05
 */

import { describe, expect, it } from 'vitest';
import {
  slotValueFailures,
  xpBandNotes,
} from '../../../../.github/scripts/checkMdxFormat';

describe('slotValueFailures', () => {
  it('lets a well-formed monster through', () => {
    expect(
      slotValueFailures(
        '<Monster\n  size="Large"\n  hitPoints="153 ([% 18d10 +54 %])"\n  str="18"\n  challenge="13"\n  xp="10000"\n  tierBonus="+5">',
      ),
    ).toBe(false);
  });

  it('names an ability score that is not a number', () => {
    expect(slotValueFailures('<Monster str="banana">')).toMatch(
      /<Monster str="banana"> expects a whole number/,
    );
  });

  it('names a rating that still carries its XP', () => {
    expect(slotValueFailures('<Monster challenge="3 (700 XP)">')).toMatch(
      /XP belongs in its own slot/,
    );
  });

  it('leaves the XP band alone, since a rating and its XP are both authored', () => {
    expect(slotValueFailures('<Monster challenge="8" xp="7200">')).toBe(false);
    expect(slotValueFailures('<Monster challenge="2" xp="420">')).toBe(false);
  });

  it('wants a monster save DC fixed, and leaves an item DC free', () => {
    expect(slotValueFailures('<Monster saveDc="16">')).toBe(false);
    expect(slotValueFailures('<Monster saveDc="10 + TB + WIS">')).toMatch(
      /fixed DC/,
    );
    expect(slotValueFailures('<Heirloom saveDc="10 + your tier bonus">')).toBe(
      false,
    );
  });

  it('applies the spell level rule only under Spell', () => {
    expect(slotValueFailures('<Spell level="cantrip">')).toBe(false);
    expect(slotValueFailures('<Spell level="13">')).toMatch(/0 to 12/);
    expect(slotValueFailures('<Feature level="13">')).toBe(false);
  });

  it('ignores attributes that are not slots, and prose that mentions a slot', () => {
    expect(slotValueFailures('<Monster alt="banana"> str="x" in prose')).toBe(
      false,
    );
  });

  it('reports every failure in the file, not the first', () => {
    const result = slotValueFailures('<Monster str="a" dex="b">');
    expect(result).toMatch(/str="a"/);
    expect(result).toMatch(/dex="b"/);
  });
});

describe('xpBandNotes', () => {
  it('states the band a written XP falls in beside the written rating', () => {
    expect(xpBandNotes('<Monster challenge="8" xp="7200">')).toMatch(
      /CR 8 runs 3900–4999 XP; 7200 sits in the CR 11 band/,
    );
    expect(xpBandNotes('<Monster challenge="2" xp="420">')).toMatch(
      /sits in the CR 1 band/,
    );
  });

  it('says nothing when the XP sits in its own rating band', () => {
    expect(xpBandNotes('<Monster challenge="7" xp="3,100">')).toBe(false);
    expect(xpBandNotes('<Monster challenge="1/2" xp="199">')).toBe(false);
    expect(xpBandNotes('<Monster challenge="35" xp="900000">')).toBe(false);
    expect(xpBandNotes('<Monster challenge="13" xp="10,000">')).toBe(false);
  });

  it('says nothing for a host that is not a monster or a block missing either value', () => {
    expect(xpBandNotes('<Spell challenge="8" xp="7200">')).toBe(false);
    expect(xpBandNotes('<Monster challenge="8">')).toBe(false);
    expect(xpBandNotes('<Monster xp="7200">')).toBe(false);
  });
});
