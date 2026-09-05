/**
 * @fileoverview Tests for the legacy prose scrubber.
 * @description The grammar, written down. Each save shape the corpus uses
 * has its rewrite; subject number is read head-first and carried onto the
 * verb after `or` and a second verb after `and`; anything outside the
 * grammar is declined to review rather than guessed at.
 *
 * @module tests/unit/scripts/content/scrub-legacy-prose.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-04
 */

import { describe, expect, it } from 'vitest';
import {
  PASS_IDS,
  scrub,
  subjectNumber,
} from '../../../../scripts/content/scrub-legacy-prose.mjs';

/**
 * Scrubs one line and returns the rewritten line.
 *
 * @param {string} line - Input line
 * @param {string[]} [passes] - Pass ids; all when omitted
 * @returns {string} Output line
 */
const out = (line: string, passes?: string[]): string =>
  scrub(line, passes ? new Set(passes) : undefined).text;

describe('subjectNumber', () => {
  it.each([
    ['The target', 'singular'],
    ['Each creature in the area', 'singular'],
    ['Any creature under the mud when it falls', 'singular'],
    ['it', 'singular'],
    ['A creature [# kw:condition:grappled #] by **three or more arms**', 'singular'],
    ['Creatures within [= 2 stride =] of the frog', 'plural'],
    ['All creatures of her choice within **[= 6 stride =]**', 'plural'],
    ['targets', 'plural'],
    ['they', 'plural'],
    ['you', 'second'],
    ['As a [# kw:delayed #] effect, creatures in this aura', 'plural'],
    ['If a creature interacts with him in any way, such as speaking, they', 'plural'],
    ['Whenever the creatures in the aura act, it', 'singular'],
    ['All creatures who have cast a spell in the last minute', 'plural'],
    ['the intersecting creature', 'singular'],
    ['All creatures within [= 1 stride =] of the machine take 8 and each', 'singular'],
    ['Each creature within **[= 3 stride =] of you**', 'singular'],
    ['creatures within [= 2 stride =] of it', 'plural'],
    ['The target and each creature within **[= 2 stride =]** of it', 'plural'],
    ['When the Mule is slain, it ruptures outward; all creatures within [= 1 stride =]', 'plural'],
  ])('reads "%s" as %s', (subject, number) => {
    expect(subjectNumber(subject)).toBe(number);
  });

  it('gives up on a relative clause or nothing recognisable', () => {
    expect(subjectNumber('who')).toBeNull();
    expect(subjectNumber('a [= 12 stride;ADJ =]-long line')).toBeNull();
  });
});

describe('saves', () => {
  it('rewrites the dominant shape: DC before ability, or <verb>', () => {
    expect(
      out('The target must succeed on a DC 20 Strength saving throw or be knocked [# kw:condition:prone #].'),
    ).toBe('The target saves Strength against DC 20 or is knocked [# kw:condition:prone #].');
  });

  it('agrees the verb to a plural head noun read head-first', () => {
    expect(
      out('Creatures within [= 2 stride =] of the frog must succeed on a DC 16 Wisdom saving throw or be charmed.'),
    ).toBe('Creatures within [= 2 stride =] of the frog save Wisdom against DC 16 or are charmed.');
  });

  it('agrees a second coordinated verb after and', () => {
    expect(
      out('Each creature whose space it passes through must succeed on a DC 15 Dexterity saving throw or take 22 and be knocked prone.'),
    ).toBe('Each creature whose space it passes through saves Dexterity against DC 15 or takes 22 and is knocked prone.');
  });

  it('keeps a plural subject bare on both verbs', () => {
    expect(out('Targets must succeed on a DC 12 Constitution saving throw or take 5 and fall prone.')).toBe(
      'Targets save Constitution against DC 12 or take 5 and fall prone.',
    );
  });

  it('uses the second person bare form for you', () => {
    expect(out('you must succeed on a DC 15 Constitution saving throw or suffer one level of exhaustion.')).toBe(
      'you save Constitution against DC 15 or suffer one level of exhaustion.',
    );
  });

  it('collapses taking X on a failed save, or half on a success, into halving', () => {
    expect(
      out('Each creature in the area must make a DC 16 Constitution saving throw, taking 50 ([% 10d8 bludgeoning %]) on a failed save, or half as much on a successful one.'),
    ).toBe('Each creature in the area saves Constitution against DC 16, halving 50 ([% 10d8 bludgeoning %]).');
  });

  it.each([
    'on a failure or half as much on a success',
    'on a failed save, or half on a success',
    'on a failure, or half damage on a success',
    'on a failed save, or half as much damage on a successful save',
  ])('accepts the halving wording "%s"', (wording) => {
    const line = `It must make a DC 10 Dexterity saving throw, taking [% 3d6 fire %] ${wording}.`;
    expect(out(line)).toBe('It saves Dexterity against DC 10, halving [% 3d6 fire %].');
  });

  it('keeps bold and a two-part damage expression inside halving', () => {
    expect(
      out('It must make a DC 10 Dexterity saving throw, taking **30 ([% 6d10 fire %])** and **30 ([% 6d10 piercing %])** on a failed save, or half as much on a success.'),
    ).toBe('It saves Dexterity against DC 10, halving **30 ([% 6d10 fire %])** and **30 ([% 6d10 piercing %])**.');
  });

  it('keeps a halving tail verbatim when it carries a rider, since the rider is not halved', () => {
    expect(
      out('It must make a DC 10 Dexterity saving throw, taking [% 4d8 frost %] and becoming blinded on a failed save, or half as much on a success.'),
    ).toBe('It saves Dexterity against DC 10, taking [% 4d8 frost %] and becoming blinded on a failed save, or half as much on a success.');
  });

  it('keeps a clause with its own subject after or', () => {
    expect(out('The attacker must succeed on a DC 23 Dexterity saving throw or the attack misses.')).toBe(
      'The attacker saves Dexterity against DC 23 or the attack misses.',
    );
    expect(out('creatures in the aura must succeed on a DC 24 Strength saving throw or their speed becomes 0.')).toBe(
      'creatures in the aura save Strength against DC 24 or their speed becomes 0.',
    );
  });

  it('keeps a tail that only qualifies the save', () => {
    expect(out('they must succeed on a DC 12 Constitution saving throw at the end of each hour while wearing it.')).toBe(
      'they save Constitution against DC 12 at the end of each hour while wearing it.',
    );
    expect(out('it must make a Constitution saving throw with a DC equal to the damage taken.')).toBe(
      'it saves Constitution with a DC equal to the damage taken.',
    );
    expect(out('The target must succeed on a DC 25 Strength saving throw to resist being pulled.')).toBe(
      'The target saves Strength against DC 25 to resist being pulled.',
    );
    expect(out('Each creature must make a DC 16 Constitution save, taking [% 5d8 dark %] and triggering Rot even on a success.')).toBe(
      'Each creature saves Constitution against DC 16, taking [% 5d8 dark %] and triggering Rot even on a success.',
    );
  });

  it.each([
    ['all creatures have to succeed on a DC 16 Constitution saving throw or be petrified.', 'all creatures save Constitution against DC 16 or are petrified.'],
    ['The target must roll a DC 17 charisma saving throw or be stunned.', 'The target saves charisma against DC 17 or is stunned.'],
    ['Creatures in the area must succeed a **DC 25 Strength saving throw** or **sink**.', 'Creatures in the area save Strength against DC 25 or **sink**.'],
    ['it must make a successful Strength saving throw or take [% 5d10 force %].', 'it saves Strength or takes [% 5d10 force %].'],
    ['The target must succeed on a DC 25 **Charisma saving throw** or become frightened.', 'The target saves Charisma against DC 25 or becomes frightened.'],
    ['Then makes a **DC 15 Constitution saving throw**.', 'Then saves Constitution against DC 15.'],
    ['forcing the target to make a DC 16 Dexterity saving throw or take [% 2d8 slashing %].', 'forcing the target to save Dexterity against DC 16 or take [% 2d8 slashing %].'],
  ])('accepts the verb variant: %s', (before, after) => {
    expect(out(before)).toBe(after);
  });

  it('starts the subject after a semicolon', () => {
    expect(out('it ruptures outward; all creatures within **[= 1 stride =]** must make a **DC 13 Constitution saving throw**.')).toBe(
      'it ruptures outward; all creatures within **[= 1 stride =]** save Constitution against DC 13.',
    );
    expect(out('When the Mule is **slain**, it ruptures; all creatures within **[= 1 stride =]** must make a **DC 13 Constitution saving throw**.')).toBe(
      'When the Mule is **slain**, it ruptures; all creatures within **[= 1 stride =]** save Constitution against DC 13.',
    );
  });

  it('reads each at the end of a subject as singular', () => {
    expect(out('All creatures take 8 and each has to succeed on a DC 23 Dexterity saving throw or gain 1 stack.')).toBe(
      'All creatures take 8 and each saves Dexterity against DC 23 or gains 1 stack.',
    );
  });

  it('closes a bold that the legacy clause opened', () => {
    expect(out('they must succeed on a **DC 12 Constitution saving throw at the end of each hour** while wearing it.')).toBe(
      'they save Constitution against DC 12 at the end of each hour while wearing it.',
    );
    expect(out('**The target must succeed on a DC 20 Wisdom saving throw** or be charmed.')).toBe(
      'The target saves Wisdom against DC 20 or is charmed.',
    );
  });

  it.each([
    [
      'The target must succeed on a Wisdom saving throw against your **Spell Save DC** or become grappled.',
      'The target saves Wisdom against your **Spell Save DC** or becomes grappled.',
    ],
    [
      'Each creature of your choice in the sphere must make a **Constitution saving throw** (DC = your spell save DC).',
      'Each creature of your choice in the sphere saves Constitution against your spell save DC.',
    ],
    [
      'Each creature in the area must make a **Dexterity saving throw** (DC 10 + your Tier Bonus + your Strength modifier).',
      'Each creature in the area saves Dexterity against DC 10 + your Tier Bonus + your Strength modifier.',
    ],
    [
      'Each creature must make a Wisdom saving throw (DC = **10 +your Strength modifier + your Tier Bonus**).',
      'Each creature saves Wisdom against DC **10 +your Strength modifier + your Tier Bonus**.',
    ],
    ['it must succeed on a **Wisdom saving throw**, or become deafened.', 'it saves Wisdom, or becomes deafened.'],
    ['it must succeed on a **Constitution saving throw**, or its speed is reduced to 0.', 'it saves Constitution, or its speed is reduced to 0.'],
    ['it must succeed on a Wisdom saving throw, or it disappears.', 'it saves Wisdom, or it disappears.'],
    [
      'each creature must make a Dexterity saving throw **(DC 10 + your tier bonus)**, taking [% 2d6 %] on a failed save, or half as much on a success.',
      'each creature saves Dexterity against DC 10 + your tier bonus, halving [% 2d6 %].',
    ],
    [
      'The target must succeed on a **Constitution saving throw** (DC = your spell save DC) or take **Frost damage** and, if **Large or smaller**, be **pushed** away.',
      'The target saves Constitution against your spell save DC or takes **Frost damage** and, if **Large or smaller**, is **pushed** away.',
    ],
    ['Each creature within **[= 3 stride =] of you** must make a **Dexterity saving throw**.', 'Each creature within **[= 3 stride =] of you** saves Dexterity.'],
    ['Each creature must make a Wisdom saving throw against your spell save DC, taking [% 2d6 %] on a failed save, or half as much on a success.', 'Each creature saves Wisdom against your spell save DC, halving [% 2d6 %].'],
  ])('reads a named or computed DC: %s', (before, after) => {
    expect(out(before)).toBe(after);
  });

  it('reads through a bracket expression carrying a semicolon', () => {
    expect(
      out('Each creature in a **[= 3 stride;ADJ =] cube** centered on that point must make a **Constitution saving throw**, taking [% 1d10 %] on a failed save, or half as much on a success.'),
    ).toBe('Each creature in a **[= 3 stride;ADJ =] cube** centered on that point saves Constitution, halving [% 1d10 %].');
  });

  it('knows creature types as head nouns', () => {
    expect(out('- Each Undead in **[= 6 stride =]** must make a **Wisdom saving throw**.')).toBe('- Each Undead in **[= 6 stride =]** saves Wisdom.');
    expect(out('All undead within [= 6 stride =] must make a Wisdom saving throw.')).toBe('All undead within [= 6 stride =] save Wisdom.');
  });

  it('turns repeats the save into resist', () => {
    expect(out('it repeats the save at the end of each of its turns.')).toBe('it can [# kw:resist #] at the end of each of its turns.');
  });

  it('agrees any table verb after and', () => {
    expect(out('it must make a Strength saving throw or take 5 and have its speed reduced to 0.')).toBe(
      'it saves Strength or takes 5 and has its speed reduced to 0.',
    );
  });

  it('reads past a bold span that closes just before must', () => {
    expect(
      out('On a hit, the target takes **[% 4d8 magical %] piercing damage** and must succeed on a **DC 16 Dexterity saving throw** or be grappled.'),
    ).toBe('On a hit, the target takes **[% 4d8 magical %] piercing damage** and saves Dexterity against DC 16 or is grappled.');
    expect(
      out('**Retinue** of it or another retinue. Each creature within **[= 1 stride =]** must make a **DC 16 Dexterity saving throw**, taking **18 dark damage** on a failure or half damage on a success.'),
    ).toBe('**Retinue** of it or another retinue. Each creature within **[= 1 stride =]** saves Dexterity against DC 16, halving **18 dark damage**.');
  });

  it('turns repeat the saving throw into resist, keeping the subject', () => {
    expect(
      out('The [# kw:condition:restrained #] target can repeat the saving throw at the end of each of its turns, ending the effect on a success.'),
    ).toBe('The [# kw:condition:restrained #] target can [# kw:resist #] at the end of each of its turns.');
    expect(out('They can repeat the saving throw at the end of each of their turns, ending the effect on themselves on a success.')).toBe(
      'They can [# kw:resist #] at the end of each of their turns.',
    );
    expect(out('- The creature may repeat the saving throw at the **end of each of its turns**, ending the effect on a success.')).toBe(
      '- The creature may [# kw:resist #] at the **end of each of its turns**.',
    );
    expect(out('At the end of each of its turns, the creature may repeat the saving throw, ending the effect on a success.')).toBe(
      'At the end of each of its turns, the creature may [# kw:resist #].',
    );
  });

  it('agrees a verb after or immediately', () => {
    expect(out('it must succeed on a DC 26 Constitution saving throw or immediately cast the spell.')).toBe(
      'it saves Constitution against DC 26 or immediately casts the spell.',
    );
  });

  it('rewrites a bare clause with no outcome', () => {
    expect(out('Each creature in that area must make a Dexterity saving throw.')).toBe(
      'Each creature in that area saves Dexterity.',
    );
  });

  it('reads a DC written in parentheses after the noun', () => {
    expect(out('The target must make a Strength saving throw (DC 27) or fall.')).toBe(
      'The target saves Strength against DC 27 or falls.',
    );
  });

  it('declines a DC that is an expression', () => {
    const line = 'The target must make a Strength saving throw (DC 10 or half the damage taken, whichever is higher).';
    const result = scrub(line);
    expect(result.text).toBe(line);
    expect(result.review[0]?.question).toMatch(/expression/);
  });

  it('drops the bold that wrapped the whole legacy clause', () => {
    expect(out('The target must succeed on a **DC 21 Constitution saving throw** or fail one death saving throw.')).toBe(
      'The target saves Constitution against DC 21 or fails one death saving throw.',
    );
  });

  it('accepts save as the noun', () => {
    expect(out('creatures within [= 1 stride =] must make a **DC 19 Dexterity** save or take **7 ([% 2d6 chemical %])**.')).toBe(
      'creatures within [= 1 stride =] save Dexterity against DC 19 or take **7 ([% 2d6 chemical %])**.',
    );
  });

  it('declines an unknown verb after or', () => {
    const line = 'The target must succeed on a DC 15 Wisdom saving throw or wander off.';
    const result = scrub(line);
    expect(result.text).toBe(line);
    expect(result.review[0]?.question).toMatch(/agreement table/);
  });

  it('declines an unreadable subject', () => {
    const line = 'who must succeed on a DC 15 Wisdom saving throw or be charmed.';
    const result = scrub(line);
    expect(result.text).toBe(line);
    expect(result.review).toHaveLength(1);
  });
});

describe('attacks', () => {
  it('rewrites the opener and the hit line', () => {
    expect(
      out('_Melee Weapon Attack:_ +9 to hit, reach [= 1 stride =], one target. _Hit:_ 8 ([% 1d8 +4 bludgeoning %]).'),
    ).toBe('Accuracy +9, reach [= 1 stride =], one creature. On a hit, 8 ([% 1d8 +4 bludgeoning %]).');
  });

  it.each([
    '_Melee Weapon Attack_: +5 to hit, reach [= 1 stride =], one target.',
    '_Melee Weapon Attack:_ +5 to hit, reach **[= 1 stride =]**, one target.',
    '_Melee Weapon Attack:_ +5 to hit, reach [= 1 stride =]; one target.',
    '_Ranged Spell Attack:_ +5 to hit, range [= 12 stride =], one target.',
  ])('accepts the punctuation and bold variants: %s', (line) => {
    expect(out(line)).toMatch(/^Accuracy \+5, (?:reach|range) \**\[= \d+ stride =\]\**, one creature\.$/);
  });

  it('converts a lone +N to hit', () => {
    expect(out('a Black Quill Strike (+13 to hit) dealing damage')).toBe(
      'a Black Quill Strike (accuracy +13) dealing damage',
    );
  });

  it.each([
    ['_Melee Weapon Attack:_ accuracy +15, reach [= 4 stride =], up to two targets.', 'Accuracy +15, reach [= 4 stride =], up to two targets.'],
    ['_Ranged Spell Attack_ (range [= 12 stride =], accuracy +4)', '(range [= 12 stride =], accuracy +4)'],
    ['_Melee Weapon Attack_; reach [= 1 stride =]', 'Reach [= 1 stride =]'],
    ['Melee Weapon Attack: accuracy +16, reach [= 2 stride =], one target.', 'Accuracy +16, reach [= 2 stride =], one creature.'],
  ])('drops a label left behind: %s', (before, after) => {
    expect(out(before)).toBe(after);
  });

  it('leaves the words in prose and one target outside an attack line', () => {
    for (const line of ['it makes a melee weapon attack against one target.', 'Choose one target within sight.']) {
      expect(out(line)).toBe(line);
    }
  });

  it('accepts a bonus written in words', () => {
    expect(out('_Melee Weapon Attack:_ your spell attack modifier to hit, reach [= 1 stride =]; one target.')).toBe(
      'Accuracy your spell attack modifier, reach [= 1 stride =]; one creature.',
    );
    expect(out('_Melee Weapon Attack:_ your TB + Strength to hit, reach [= 1 stride =]; one target.')).toBe(
      'Accuracy your TB + Strength, reach [= 1 stride =]; one creature.',
    );
  });

  it('accepts the _Hit_: spelling', () => {
    expect(out('_Hit_: 6 ([% 1d6 %]).')).toBe('On a hit, 6 ([% 1d6 %]).');
  });
});

describe('substitutions', () => {
  it.each([
    ['briefly', 'stunned until the end of its next turn.', 'stunned [# kw:briefly #].'],
    ['briefly', 'charmed until the end of their next turn.', 'charmed [# kw:briefly #].'],
    ['no-action', 'issue commands (no action required), which', 'issue commands, which'],
    ['no-action', 'restore 1d6 hit points, no action required.', 'restore 1d6 hit points.'],
    ['upcast', '[_Flame Strike_](/spells/flame-strike) (upcast)', '[_Flame Strike_](/spells/flame-strike) (overcast)'],
    ['upcast', 'These spells cannot be upcast.', 'These spells cannot be overcast.'],
    ['per-day', 'Reprise of the First (1/Day)', 'Reprise of the First (1/[# kw:Recovery #])'],
    ['bonus-action', 'As a Bonus Action, eat one.', 'As a Minor Action, eat one.'],
    ['magic-action', 'take the **Magic** action', 'take the Major Action'],
    ['pb', 'DC 10 + PB + your modifier', 'DC 10 + TB + your modifier'],
    ['pb', 'add your Proficiency Bonus', 'add your tier bonus'],
  ])('%s: %s', (pass, before, after) => {
    expect(out(before, [pass])).toBe(after);
  });

  it('leaves the wielder\'s next turn alone', () => {
    const line = 'you cannot fire it again until the end of your next turn.';
    expect(out(line, ['briefly'])).toBe(line);
  });
});

describe('scrub', () => {
  it('runs every pass by default', () => {
    expect(new Set(PASS_IDS).size).toBeGreaterThan(5);
  });

  it('leaves frontmatter, headings and fenced code', () => {
    const text = ['---', 'x: must make a Wisdom saving throw', '---', '## must make a Wisdom saving throw', '```', 'The target must make a Wisdom saving throw.', '```'].join('\n');
    expect(scrub(text).text).toBe(text);
  });

  it('preserves a trailing hard break', () => {
    expect(out('Each creature in that area must make a Dexterity saving throw.  ')).toBe(
      'Each creature in that area saves Dexterity.  ',
    );
  });

  it('preserves CRLF', () => {
    expect(out('a\r\nIt must make a Wisdom saving throw.\r\nb')).toBe('a\r\nIt saves Wisdom.\r\nb');
  });
});
