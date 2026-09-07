/**
 * @fileoverview Tests for the attack converter.
 * @description Bullets under a Multiattack become fifth-level blocks, attacks
 * among them wrapped in `<Attack>`; an action whose body is an attack wraps
 * that body; clauses without reach or range stay as prose and are reported.
 *
 * @module tests/unit/scripts/content/migrate-attack.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-07
 */

import { describe, expect, it } from 'vitest';
import { migrateAttack, readClause } from '../../../../scripts/content/migrate-attack.mjs';

const SHEET = `# Frog

<Monster size="Small" type="Beast" alignment="Unaligned">

## Actions

<Action>

#### Multiattack

The frog makes two attacks.

- **Bite.** Accuracy +6, reach [= 1 stride =], one creature. On a hit, 10 ([% 1d10 +3 piercing %]).
- **Grapple.** The frog can attempt to grapple.

</Action>

<Action>

#### Tongue

Accuracy +8, range **[= 6 stride =]**, up to two targets.
On a hit, 5 ([% 1d6 +2 bludgeoning %]).

</Action>

</Monster>
`;

describe('readClause', () => {
  it('reads reach, range, both, and targets other than one creature', () => {
    expect(readClause('reach [= 1 stride =], one creature')).toEqual({ reach: '[= 1 stride =]' });
    expect(readClause('range 10–[= 6 stride =], one creature')).toEqual({ range: '10–[= 6 stride =]' });
    expect(readClause('reach [= 2 stride =] or range [= 12 stride =]/[= 48 stride =], one creature')).toEqual({
      reach: '[= 2 stride =]',
      range: '[= 12 stride =]/[= 48 stride =]',
    });
    expect(readClause('reach [= 4 stride =], up to two targets')).toEqual({
      reach: '[= 4 stride =]',
      targets: 'up to two targets',
    });
    expect(readClause('range **[= 12 stride =]/[= 36 stride =]**, one creature')).toEqual({
      range: '[= 12 stride =]/[= 36 stride =]',
    });
    expect(readClause('[= 24 stride =], one creature')).toBeNull();
  });
});

describe('migrateAttack', () => {
  it('promotes Multiattack bullets to blocks and wraps a bare attack action', () => {
    const result = migrateAttack(SHEET);
    expect(result.changed).toBe(true);
    expect(result.notes).toEqual([]);
    expect(result.text).toContain(`<Action>

#### Multiattack

The frog makes two attacks.

<Attack accuracy="+6" reach="[= 1 stride =]">

##### Bite

On a hit, 10 ([% 1d10 +3 piercing %]).

</Attack>

##### Grapple

The frog can attempt to grapple.

</Action>

<Action>

#### Tongue

<Attack accuracy="+8" range="[= 6 stride =]" targets="up to two targets">

On a hit, 5 ([% 1d6 +2 bludgeoning %]).

</Attack>

</Action>
`);
  });

  it('keeps multi-line hit prose verbatim and a parenthetical on the heading', () => {
    const result = migrateAttack(
      '<Action cost="1 Major Action">\n\n#### Multiattack\n\n- **Mycelial Lash.**  \n  Accuracy +7, reach [= 3 stride =], one creature.  \n  On a hit, 13 ([% 2d8 +4 slashing %]).  \n  If the target is Large, it is grappled.\n- **Brine Jet** (Recharge 5–6)  \n  Accuracy +17, reach [= 2 stride =] or range [= 12 stride =]/[= 48 stride =], one creature.  \n  On a hit, 20.\n\n</Action>\n',
    );
    expect(result.text).toBe(
      '<Action cost="1 Major Action">\n\n#### Multiattack\n\n<Attack accuracy="+7" reach="[= 3 stride =]">\n\n##### Mycelial Lash\n\nOn a hit, 13 ([% 2d8 +4 slashing %]).  \nIf the target is Large, it is grappled.\n\n</Attack>\n\n<Attack accuracy="+17" reach="[= 2 stride =]" range="[= 12 stride =]/[= 48 stride =]">\n\n##### Brine Jet (Recharge 5–6)\n\nOn a hit, 20.\n\n</Attack>\n\n</Action>\n',
    );
    expect(result.notes).toEqual(['parenthetical kept on the heading: ##### Brine Jet (Recharge 5–6)']);
  });

  it('reads bullets whose lines continue without indentation, one block each', () => {
    const result = migrateAttack(
      '<Action>\n\n#### Multiattack\n\nThe militiaman makes two melee attacks.\n\n- **Shotel Slash.**  \nAccuracy +4, reach [= 1 stride =], one creature.  \nOn a hit, 7 ([% 1d8 +3 slashing %]).\n\n- **Hooked Halberd.**  \nAccuracy +4, reach [= 2 stride =], one creature.  \nOn a hit, 9 ([% 1d10 +3 slashing %]).  \nOn hit, the target saves Strength against DC 11 or is **pulled [= 1 stride =] closer**.\n\n</Action>\n',
    );
    expect(result.text).toBe(
      '<Action>\n\n#### Multiattack\n\nThe militiaman makes two melee attacks.\n\n<Attack accuracy="+4" reach="[= 1 stride =]">\n\n##### Shotel Slash\n\nOn a hit, 7 ([% 1d8 +3 slashing %]).\n\n</Attack>\n\n<Attack accuracy="+4" reach="[= 2 stride =]">\n\n##### Hooked Halberd\n\nOn a hit, 9 ([% 1d10 +3 slashing %]).  \nOn hit, the target saves Strength against DC 11 or is **pulled [= 1 stride =] closer**.\n\n</Attack>\n\n</Action>\n',
    );
    expect(result.notes).toEqual([]);
  });

  it('leaves a clause without reach or range as prose and reports every unlifted line', () => {
    const result = migrateAttack(
      '<Action>\n\n#### Hand-Cannon\n\nAccuracy +6, [= 24 stride =], one creature.\nOn a hit, 5.\n\n</Action>\n\n> - **Claw.** Accuracy +11, reach [= 1 stride =]; **12**.\n',
    );
    expect(result.changed).toBe(false);
    expect(result.skipped).toBe('no attack lines read');
    expect(result.notes).toEqual([
      'attack kept as prose: Accuracy +6, [= 24 stride =], one creature.',
      'accuracy line kept as prose: Accuracy +6, [= 24 stride =], one creature.',
      'accuracy line kept as prose: > - **Claw.** Accuracy +11, reach [= 1 stride =]; **12**.',
    ]);
  });

  it('keeps prose before the accuracy line outside the block, and leaves a converted action alone', () => {
    const result = migrateAttack(
      '<Action>\n\n#### Engender Sunspawn\n\nThe Delphytion hurls a larva.\nAccuracy +10, range [= 12 stride =], one creature.\n**Hit**: 11 ([% 2d6 +4 chemical %]).\n\n</Action>\n',
    );
    expect(result.text).toBe(
      '<Action>\n\n#### Engender Sunspawn\n\nThe Delphytion hurls a larva.\n<Attack accuracy="+10" range="[= 12 stride =]">\n\n**Hit**: 11 ([% 2d6 +4 chemical %]).\n\n</Attack>\n\n</Action>\n',
    );
    const again = migrateAttack(result.text);
    expect(again.changed).toBe(false);
    expect(again.skipped).toBe('no attack lines read');
  });

  it.each([
    ['no attack lines read', '<Action>\n\n#### Roar\n\nEveryone trembles.\n\n</Action>\n'],
    ['no action blocks', '# Frog\n\nAccuracy +6, reach [= 1 stride =], one creature.\n'],
  ])('skips with "%s"', (reason, text) => {
    const result = migrateAttack(text);
    expect(result.changed).toBe(false);
    expect(result.skipped).toBe(reason);
  });
});
