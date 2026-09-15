/**
 * @fileoverview Tests for the displacement register codemod.
 * @description Each direction in the closed set converts, a site with no
 * stated direction is left alone, and bold that would break is refused
 *
 * @module tests/unit/scripts/content/rewrite-displacement.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-15
 */

import { describe, expect, it } from 'vitest';
import {
  DIRECTIONS,
  readDirection,
  rewrite,
  rewriteLine,
} from '../../../../scripts/content/rewrite-displacement.mjs';

describe('DIRECTIONS', () => {
  it('keeps ids unique', () => {
    const ids = DIRECTIONS.map((direction) => direction.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('reads each member of the set', () => {
    expect(readDirection(' away from you.')?.text).toBe('away from you');
    expect(readDirection(' directly away from the center, and')?.text).toBe(
      'away from the center',
    );
    expect(readDirection(' straight toward you (or as far)')?.text).toBe(
      'toward you',
    );
    expect(readDirection(' closer to the caster frog.')?.text).toBe(
      'toward the caster frog',
    );
    expect(readDirection(" in a direction of the Cerithol's choosing")?.text).toBe(
      "in a direction of the Cerithol's choice",
    );
    expect(readDirection(' in a random direction and')?.text).toBe(
      'in a random direction',
    );
    expect(readDirection(' into the air (landing')?.text).toBe('upward');
    expect(readDirection(' back.')?.text).toBe('away');
    expect(readDirection(' away and knocked')?.text).toBe('away');
    expect(readDirection(' closer.')).toBeNull();
    expect(readDirection(' and knocked prone')).toBeNull();
    expect(readDirection(' forward by the wall')).toBeNull();
  });
});

describe('rewriteLine', () => {
  it.each([
    [
      'a creature takes [% 2d8 bludgeoning %] and is pushed [= 2 stride =] away from you.',
      'a creature takes [% 2d8 bludgeoning %] and is displaced [= 2 stride =] away from you.',
    ],
    [
      'is pulled [= 2 stride =] closer to the caster frog.',
      'is displaced [= 2 stride =] toward the caster frog.',
    ],
    [
      'is hurled up to **[= 24 stride =]** in a direction of the Apex Cerithol’s choosing and knocked prone',
      "is displaced up to [= 24 stride =] in a direction of the Apex Cerithol's choice and knocked prone",
    ],
    [
      'is flung up [= 4 stride =] away from the center of the whirlwind in a random direction',
      'is displaced [= 4 stride =] away from the center of the whirlwind in a random direction',
    ],
    [
      '| Tackling | Str | The target is pushed [= 4 stride =] straight away from you. |',
      '| Tackling | Str | The target is displaced [= 4 stride =] away from you. |',
    ],
    [
      'is pulled [= 2 stride =] straight toward you (or as far as space allows).',
      'is displaced [= 2 stride =] toward you (or as far as space allows).',
    ],
    [
      'you can push the creature [= 1 stride =] straight away from yourself if',
      'you can displace the creature [= 1 stride =] away from yourself if',
    ],
    [
      'Failing targets are **pushed [= 2 stride =] away** from you.',
      'Failing targets are displaced [= 2 stride =] away from you.',
    ],
    [
      'that fail are also **pushed [= 2 stride =] away from the cube’s center**.',
      'that fail are also displaced [= 2 stride =] away from the cube’s center.',
    ],
    [
      'is launched [= 4 stride =] into the air (landing prone)',
      'is displaced [= 4 stride =] upward (landing prone)',
    ],
    [
      "is launched **[= 8 stride =]** in a straight line toward the spell's target.",
      "is displaced [= 8 stride =] toward the spell's target.",
    ],
    [
      'the target is pushed back [= 1 stride =].',
      'the target is displaced [= 1 stride =] away.',
    ],
    [
      'are **pushed [= 4 stride =] away**.',
      'are displaced [= 4 stride =] away.',
    ],
    [
      'and are pushed [= 2 stride =] back (half on success, no push).',
      'and are displaced [= 2 stride =] away (half on success, no displacement).',
    ],
    [
      'are pushed [= 2 stride =] away from the target. Saving targets are not pushed.',
      'are displaced [= 2 stride =] away from the target. Saving targets are not displaced.',
    ],
    [
      'you may pull that target **up to [= 2 stride =]** straight toward you, and',
      'you may displace that target up to [= 2 stride =] toward you, and',
    ],
    [
      'it may immediately shove that creature [= 2 stride =] in any direction of its choosing as a Minor Action.',
      'it may immediately displace that creature [= 2 stride =] in a direction of its choice as a Minor Action.',
    ],
    [
      'you hurl it up to **[= 60 stride =]** in a straight line in a direction of your choice.',
      'you displace it up to [= 60 stride =] in a direction of your choice.',
    ],
    [
      'the creature takes [% 5d6 force %] and is pulled to [= 1 stride =] closer to the black hole.',
      'the creature takes [% 5d6 force %] and is displaced [= 1 stride =] toward the black hole.',
    ],
    [
      'You can pull a [# kw:condition:grappled #] creature up to [= 1 stride =] closer to you.',
      'You can displace a [# kw:condition:grappled #] creature up to [= 1 stride =] toward you.',
    ],
    [
      'or shove it [= 2 stride =] away.',
      'or displace it [= 2 stride =] away.',
    ],
  ])('%s', (before, after) => {
    const outcome = rewriteLine(before);
    expect(outcome.line).toBe(after);
    expect(outcome.changed).toBe(1);
    expect(outcome.left).toEqual([]);
  });

  it('leaves a site whose direction is not on the line', () => {
    const line = 'On a hit, the target is pushed [= 1 stride =] and its speed drops.';
    const outcome = rewriteLine(line);
    expect(outcome.line).toBe(line);
    expect(outcome.left).toEqual([
      { text: 'pushed [= 1 stride =]', reason: 'no direction on the line' },
    ]);
  });

  it('leaves forward, ahead and a bare closer, which the set does not name', () => {
    expect(rewriteLine('is pushed [= 1 stride =] forward by the wall.').changed).toBe(0);
    expect(rewriteLine('is pushed [= 6 stride =] ahead of the front.').changed).toBe(0);
    expect(rewriteLine('is pulled [= 1 stride =] closer.').changed).toBe(0);
  });

  it('rewrites resistance clauses without a distance', () => {
    expect(
      rewriteLine('advantage on saving throws against being pushed, pulled, or knocked [# kw:condition:prone #].').line,
    ).toBe('advantage on saving throws against being displaced or knocked [# kw:condition:prone #].');
    expect(
      rewriteLine('resist being **pushed**, **pulled**, or **knocked [# kw:condition:prone #]**').line,
    ).toBe('resist being **displaced** or **knocked [# kw:condition:prone #]**');
    expect(rewriteLine('cannot be pushed, pulled, knocked prone, or restrained').line).toBe(
      'cannot be displaced, knocked prone, or restrained',
    );
    expect(rewriteLine('If the nucleus would be pushed or pulled, Albedo').line).toBe(
      'If the nucleus would be displaced, Albedo',
    );
    expect(rewriteLine('you cannot be **moved, pushed, grappled').line).toBe(
      'you cannot be **displaced, grappled',
    );
  });

  it('leaves a plural object with no direction, and a displacement with no distance', () => {
    expect(rewriteLine('the hand pushes targets up to [= 1 stride =] plus a number of strides').changed).toBe(0);
    expect(rewriteLine('it pushes targets to one side of your choice.').changed).toBe(0);
  });

  it('converts both halves of an active push-or-pull line', () => {
    const before =
      'you can push the creature up to **[= 2 stride =]** straight away from yourself or pull the creature up to **[= 2 stride =]** toward yourself.';
    expect(rewriteLine(before)).toMatchObject({
      line: 'you can displace the creature up to [= 2 stride =] away from yourself or displace the creature up to [= 2 stride =] toward yourself.',
      changed: 2,
    });
  });

  it('refuses a rewrite that would unbalance bold', () => {
    const line = '**is pushed [= 2 stride =] away** from you';
    const outcome = rewriteLine(line);
    expect(outcome.line).toBe(line);
    expect(outcome.left[0].reason).toBe('bold span');
  });

  it('ignores ranges and voluntary movement', () => {
    for (const line of [
      'thrown with a range of [= 12 stride =]',
      '| Thrown | [= 4 stride =]/[= 12 stride =] |',
      'if you move at least [= 3 stride =] toward a creature',
    ]) {
      expect(rewriteLine(line).changed).toBe(0);
    }
  });

  it('is a no-op on the register itself', () => {
    const line = 'is displaced [= 2 stride =] away from you.';
    expect(rewriteLine(line).line).toBe(line);
  });
});

describe('rewrite', () => {
  it('counts spans and reports what it left, by line', () => {
    const text = [
      'is pushed [= 2 stride =] away from you.',
      'is pushed [= 1 stride =].',
    ].join('\n');
    const outcome = rewrite(text);
    expect(outcome.changed).toBe(1);
    expect(outcome.left).toEqual([
      {
        line: 2,
        text: 'pushed [= 1 stride =]',
        reason: 'no direction on the line',
      },
    ]);
  });
});
