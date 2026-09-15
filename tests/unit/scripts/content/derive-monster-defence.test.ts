/**
 * @fileoverview Tests for the monster defence split.
 * @description The parenthetical sets the cap, the shield and the source of
 * the Deflect, Dexterity sets Dodge, and a sheet that does not reconcile is
 * flagged rather than forced
 *
 * @module tests/unit/scripts/content/derive-monster-defence.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-15
 */

import { describe, expect, it } from 'vitest';
import {
  acParts,
  annotate,
  applyDefence,
  armourRows,
  defenceAttributes,
  candidatesFor,
  capFor,
  choiceList,
  couldWearArmour,
  groupOf,
  percentile,
  readChoices,
  tierCap,
  tierCaps,
  tierOf,
  underBandTable,
  wornReading,
  deflectSource,
  derive,
  fits,
  fixedBySlot,
  modifier,
  parseArmorClass,
  sheetsIn,
  shieldFor,
} from '../../../../scripts/content/derive-monster-defence.mjs';

describe('armourRows and fits', () => {
  const page = [
    '| Name     | Deflect | Max Dodge | Strength | Stealth      | Weight | Cost  |',
    '| -------- | ------- | --------- | -------- | ------------ | ------ | ----- |',
    '| Gambeson | 2       | —         | —        | —            | [= 7 burden =]. | 45 gp |',
    '| [# kw:hide #]         | 2 | 2 | —        | —            | [= 6 burden =]. | 10 gp  |',
    '| Halfplate    | 5 | 2 | —        | Disadvantage | [= 20 burden =]. | 750 gp |',
    '| Plate      | 8       | 0         | Str 15   | Disadvantage | [= 33 burden =]. | 1,500 gp |',
  ].join('\n');
  const rows = armourRows(page);

  it('reads the rows with how each takes Dexterity', () => {
    expect(rows).toEqual([
      { name: 'Gambeson', base: 12, dex: 'full' },
      { name: 'hide', base: 12, dex: 'max2' },
      { name: 'Halfplate', base: 15, dex: 'max2' },
      { name: 'Plate', base: 18, dex: 'none' },
    ]);
  });

  it('adds Clothing at 10 plus Dexterity when the page has the section', () => {
    const withClothing = armourRows(`${page}\n\n## Clothing\n\nClothing is worn.`);
    expect(withClothing.at(-1)).toEqual({ name: 'Clothing', base: 10, dex: 'full' });
    expect(fits(12, 1, withClothing).reading).toContain('Enhanced Clothing');
    expect(fits(12, 2, withClothing).reading).toEqual(['Clothing']);
  });

  it('reads a declared AC as a row plus a quality rung', () => {
    expect(fits(20, 2, rows)).toEqual({
      closest: ['Superior Plate'],
      unwasted: ['Supreme Halfplate'],
      reading: ['Superior Plate'],
      overCap: false,
    });
    expect(fits(19, 4, rows)).toEqual({
      closest: ['Enhanced Plate'],
      unwasted: ['Supreme Gambeson'],
      reading: ['Supreme Gambeson'],
      overCap: true,
    });
    expect(fits(16, 4, rows).reading).toEqual(['Gambeson']);
    expect(fits(17, 0, rows).reading).toEqual(['Shoddy Plate']);
    expect(fits(26, -2, rows)).toEqual({
      closest: [],
      unwasted: [],
      reading: [],
      overCap: false,
    });
  });

  it('lists candidates nearest Mundane first', () => {
    expect(candidatesFor(19, 4, rows).map((entry) => entry.label)).toEqual([
      'Enhanced Plate',
      'Superior Halfplate',
      'Supreme Gambeson',
      'True hide',
    ]);
  });

  it('prints a choice list for creatures that could wear armour and reads the marks back', () => {
    const derived = [
      {
        name: 'rigger', tag: 1, ac: 19, dex: 18, int: 14, type: 'Humanoid', lethality: 17, from: 'natural',
        fits: { reading: ['Supreme Gambeson'] }, notes: [],
      },
      { name: 'worm', tag: 1, ac: 12, dex: 10, int: 2, type: 'Beast', from: 'natural', fits: { reading: [] }, notes: [] },
      { name: 'knight', tag: 1, ac: 18, dex: 12, int: 10, type: 'Humanoid', from: 'worn', fits: { reading: [] }, notes: [] },
    ];
    expect(couldWearArmour(derived[0])).toBe(true);
    expect(couldWearArmour(derived[1])).toBe(false);
    const list = choiceList(derived, rows, [{ label: '5-7', cap: 3 }]);
    expect(list).toContain(
      '## rigger — AC 19, Dex 18 (+4), Humanoid, Int 14, lethality 17 (tier 6, up to Supreme)',
    );
    expect(list).toContain('- [ ] Superior Halfplate  (wastes 2 Dex)');
    expect(list).toContain('- [ ] Enhanced Plate  (wastes 4 Dex)');
    expect(list).toContain('- [ ] Supreme Gambeson  (script)');
    expect(list).toContain('- [ ] True hide  (wastes 2 Dex, above the tier)');
    expect(list).toContain('- [ ] natural armour');
    expect(list).not.toContain('## worm');
    expect(list).not.toContain('## knight');
    expect(list).toContain('- [ ] carries a shield');
    const marked = list
      .replace('- [ ] Enhanced Plate', '- [V] Enhanced Plate')
      .replace('- [ ] carries a buckler', '- [V] carries a buckler');
    expect(readChoices(marked)).toEqual(
      new Map([['rigger', { armour: 'Enhanced Plate', shield: 1 }]]),
    );
    const shieldOnly = list.replace('- [ ] carries a shield', '- [V] carries a shield');
    expect(readChoices(shieldOnly)).toEqual(new Map([['rigger', { armour: null, shield: 2 }]]));
    const fixed = list.replace('- [ ] Defence fixed by trait', '- [V] Defence fixed by trait');
    expect(readChoices(fixed).get('rigger')).toMatchObject({ armour: null, shield: 0, fixed: true });
    expect(fixedBySlot('10 (uncaring)')).toBe(true);
    expect(fixedBySlot('natural armor')).toBe(false);
  });

  it('keeps a normal-Dexterity reading inside the tier and says when it cannot', () => {
    expect(fits(17, 2, rows).reading).toEqual(['Halfplate']);
    expect(fits(20, 2, rows)).toMatchObject({ reading: ['Superior Plate'], overCap: false });
    expect(fits(23, 2, rows)).toMatchObject({ reading: ['True Plate'], overCap: true });
    expect(fits(21, 2, rows, 3)).toMatchObject({ reading: ['Supreme Plate'], overCap: false });
    expect(fits(21, 2, rows, 2)).toMatchObject({ reading: ['Supreme Plate'], overCap: true });
  });

  it('reads each tier group allowance off the corpus at a percentile', () => {
    expect(percentile([3, 1, 2, 0, 5], 50)).toBe(2);
    expect(percentile([3, 1, 2, 0, 5], 90)).toBe(5);
    expect(percentile([], 75)).toBeNull();
    const natural = (ac: number, dex: number, lethality: number) => ({
      ac, dex, lethality, from: 'natural',
    });
    const corpus = [
      natural(16, 18, 3), natural(15, 10, 3), natural(18, 10, 2), natural(15, 14, 1),
      natural(20, 14, 22), natural(21, 16, 23),
    ];
    const caps = tierCaps(corpus, rows, 75);
    const tier1 = caps.find((entry) => entry.label === '1');
    const tier8 = caps.find((entry) => entry.label === '8-9');
    expect(tier1).toMatchObject({ n: 4, p50: 0, cap: 0 });
    expect(tier8).toMatchObject({ n: 2, p50: 2, cap: 3 });
    expect(caps.find((entry) => entry.label === '4')).toMatchObject({ n: 0, cap: 2 });
    expect(tierCap(1, caps)).toBe(0);
    expect(tierCap(8, caps)).toBe(3);
    expect(tierCap(null, caps)).toBe(2);
    expect(tierOf(17)).toBe(6);
    expect(tierOf(1)).toBe(1);
    expect(tierOf(null)).toBeNull();
    expect(groupOf(6)?.label).toBe('5-7');
  });

  it('reads a worn row as its named armour at a rung', () => {
    const full = armourRows(
      `${page}\n| Breastplate  | 4 | 2 | —        | —            | [= 10 burden =]. | 400 gp |`,
    );
    expect(wornReading({ ac: 17, dex: 20, shield: 0, source: 'breastplate' }, full)).toEqual([
      'Enhanced Breastplate',
    ]);
    expect(wornReading({ ac: 18, dex: 12, shield: 0, source: 'plate' }, full)).toEqual(['Plate']);
    expect(
      wornReading({ ac: 21, dex: 26, shield: 2, source: 'Half Plate +1, shield' }, full),
    ).toEqual(['Superior Halfplate', 'Shield']);
    expect(wornReading({ ac: 20, dex: 14, shield: 0, source: 'Bonded Tombsteel' }, full)).toEqual([
      'Bonded Tombsteel',
    ]);
    expect(wornReading({ ac: 17, dex: 18, shield: 0, source: 'Half Palte' }, full)).toEqual([
      'Halfplate',
    ]);
  });

  it('reads a shield rung, Defense, and splits an excess between armour and shield', () => {
    const counselor = { ac: 28, dex: 16, source: 'Blessed Plate, Greatshield, Defense', multi: false };
    expect(wornReading(counselor, rows)).toEqual(['Supreme Plate', 'Supreme Greatshield', 'Defense']);
    expect(derive(counselor, rows)).toMatchObject({ dodge: 6, deflect: 12, shield: 6 });
    expect(derive(counselor, rows).notes).toContain('Supreme Greatshield');
    const named = { ac: 23, dex: 12, source: 'Plate, Superior Shield', multi: false };
    expect(wornReading(named, rows)).toEqual(['Enhanced Plate', 'Superior Shield']);
    expect(derive(named, rows)).toMatchObject({ dodge: 4, deflect: 9 });
  });

  it('lists the tags under their band, worst first', () => {
    const table = underBandTable([
      { name: 'mucklord', tag: 1, ac: 24, lethality: 28, dex: 6, dodge: -2, deflect: 26, from: 'natural', fits: { reading: [] } },
      { name: 'bandit', tag: 1, ac: 17, lethality: 3, dex: 14, dodge: 2, deflect: 15, from: 'natural', fits: { reading: ['Halfplate'] } },
      { name: 'rigger', tag: 1, ac: 19, lethality: 17, dex: 18, dodge: 4, deflect: 15, from: 'natural', fits: { reading: ['Superior Gambeson'] } },
    ]);
    const lines = table.split('\n').filter((line) => /^\| [a-z]/.test(line));
    expect(lines).toEqual([
      '| mucklord | 24 | 28 | 10 | 30 | -6 | 6 | -2 | 26 | natural |  |',
      '| rigger | 19 | 17 | 6 | 22 | -3 | 18 | 4 | 15 | natural | Superior Gambeson |',
    ]);
  });

  it('lets the unwasted row win at huge Dexterity whatever its rung', () => {
    expect(fits(18, 4, rows)).toMatchObject({ reading: ['Superior Gambeson'], overCap: false });
    expect(fits(21, 4, rows)).toMatchObject({ reading: ['True Gambeson'], overCap: true });
  });
});

describe('parseArmorClass', () => {
  it('reads the number and the parenthetical', () => {
    expect(parseArmorClass('18 (natural armor)')).toEqual({
      ac: 18,
      source: 'natural armor',
      multi: false,
    });
    expect(parseArmorClass('24')).toEqual({ ac: 24, source: '', multi: false });
    expect(parseArmorClass('**35 (back)**, 17 (front)')).toEqual({
      ac: 35,
      source: 'back; front',
      multi: true,
    });
    expect(parseArmorClass('—')).toEqual({ ac: null, source: '', multi: false });
    expect(parseArmorClass('21 (Half Plate +1, shield)')).toEqual({
      ac: 21,
      source: 'Half Plate +1, shield',
      multi: false,
    });
  });
});

describe('capFor, shieldFor and deflectSource', () => {
  it('reads heavy, medium and none', () => {
    expect(capFor('plate')).toBe(0);
    expect(capFor('blessed plate, greatshield, defense')).toBe(0);
    expect(capFor('half plate +1, shield')).toBe(2);
    expect(capFor('Half Palte')).toBe(2);
    expect(capFor('thick scales')).toBe(2);
    expect(capFor('natural armor')).toBeNull();
    expect(capFor('')).toBeNull();
  });

  it('reads the shield', () => {
    expect(shieldFor('blessed plate, greatshield, defense')).toBe(3);
    expect(shieldFor('half plate +1, shield')).toBe(2);
    expect(shieldFor('buckler')).toBe(1);
    expect(shieldFor('natural armor')).toBe(0);
  });

  it('reads worn armour from the slot and calls everything else natural', () => {
    expect(deflectSource('half plate')).toBe('worn');
    expect(deflectSource('Chain Harness')).toBe('worn');
    expect(deflectSource('tombsteel armor')).toBe('worn');
    expect(deflectSource('natural armor')).toBe('natural');
    expect(deflectSource('thick scales')).toBe('natural');
    expect(deflectSource('no armor')).toBe('natural');
    expect(deflectSource('mage armor, ring of evasion')).toBe('natural');
    expect(deflectSource('')).toBe('natural');
  });
});

describe('derive', () => {
  it('gives a creature its Dexterity as Dodge and what is left above 10 as natural armour', () => {
    expect(modifier(16)).toBe(3);
    expect(derive({ ac: 16, dex: 16, source: 'natural', multi: false })).toEqual(
      { dodge: 3, deflect: 3, from: 'natural', cap: null, shield: 0, notes: [] },
    );
    expect(derive({ ac: 24, dex: 6, source: '', multi: false })).toEqual({
      dodge: -2,
      deflect: 16,
      from: 'natural',
      cap: null,
      shield: 0,
      notes: ['negative Dexterity'],
    });
  });

  it('caps Dexterity under medium armour and drops it under heavy', () => {
    expect(derive({ ac: 17, dex: 18, source: 'half plate', multi: false })).toEqual(
      { dodge: 2, deflect: 5, from: 'worn', cap: 2, shield: 0, notes: ['Dexterity capped at 2'] },
    );
    expect(derive({ ac: 21, dex: 14, source: 'plate, shield', multi: false })).toEqual(
      { dodge: 2, deflect: 9, from: 'worn', cap: 0, shield: 2, notes: ['Dexterity capped at 0'] },
    );
  });

  it('flags a Deflect that comes out below zero', () => {
    const outcome = derive({ ac: 12, dex: 18, source: '', multi: false });
    expect(outcome.dodge).toBe(4);
    expect(outcome.deflect).toBe(-2);
    expect(outcome.notes).toEqual(['Deflect below zero']);
  });

  it('flags what it cannot split', () => {
    expect(derive({ ac: null, dex: 12, source: '', multi: false }).notes).toEqual(['no AC']);
    expect(derive({ ac: 35, dex: 12, source: 'back; front', multi: true }).notes).toEqual([
      'more than one AC',
    ]);
  });
});

describe('annotate', () => {
  const natural = { source: '', from: 'natural', notes: [] as string[] };
  const worn = { source: 'half plate', from: 'worn', notes: [] as string[] };

  it('lets the swarm settle worn against natural', () => {
    expect(annotate(natural, { wornArmour: 'Y', evidence: 'clad in mail' })).toMatchObject({
      from: 'worn',
      worn: 'Y',
      notes: ['worn per swarm, nothing on the slot'],
    });
    expect(annotate(natural, { wornArmour: 'N', evidence: 'thick hide' })).toMatchObject({
      from: 'natural',
      notes: [],
    });
  });

  it('notes a slot that names armour the swarm did not see', () => {
    expect(annotate(worn, { wornArmour: 'N', evidence: 'its own plates' }).notes).toEqual([
      'slot names armour, swarm says none',
    ]);
    expect(annotate(worn, { wornArmour: 'Y', evidence: 'half plate' }).notes).toEqual([]);
  });

  it('leaves a row alone without a verdict', () => {
    expect(annotate(natural, undefined)).toMatchObject({ from: 'natural', worn: null });
  });
});

describe('sheetsIn', () => {
  it('reads every Monster tag in a sheet', () => {
    const sheet = [
      '<Monster',
      '  armorClass="20 (natural)"',
      '  dex="14"',
      '>',
      'It raises a shield of bone.',
      '<Monster',
      '  armorClass="15 (half plate +1, shield)"',
      '  dex="18"',
      '>',
    ].join('\n');
    const rows = sheetsIn('src/content/en/monsters/probe.sheet.mdx', sheet);
    expect(rows.map((row) => [row.tag, row.dodge, row.deflect, row.from, row.shield])).toEqual([
      [1, 2, 8, 'natural', 0],
      [2, 4, 1, 'worn', 2],
    ]);
    expect(rows[0].name).toBe('probe');
  });
});

describe('defenceAttributes', () => {
  it('reads the parts of an AC as written', () => {
    expect(acParts('**35 (back)**, 17 (front)')).toEqual([
      { value: 35, label: 'back' },
      { value: 17, label: 'front' },
    ]);
    expect(acParts('17 (mage armor, ring of evasion)')).toEqual([
      { value: 17, label: 'mage armor, ring of evasion' },
    ]);
  });

  it('keeps Defence as written, shares Dodge and labels each Deflect', () => {
    expect(
      defenceAttributes({ raw: '24 (closed), 20 (open)', ac: 24, dodge: 1, deflect: 13 }),
    ).toEqual({ defence: '24 (closed), 20 (open)', deflect: '13 (closed), 9 (open)', dodge: '1' });
    expect(defenceAttributes({ raw: '16 (natural armor)', ac: 16, dodge: 0, deflect: 6 })).toEqual({
      defence: '16 (natural armor)',
      deflect: '6',
      dodge: '0',
    });
    expect(defenceAttributes({ raw: '—', ac: null, dodge: null, deflect: null })).toEqual({
      defence: '—',
      deflect: '—',
      dodge: '—',
    });
  });
});

describe('applyDefence', () => {
  const sheet = [
    '<Monster',
    '  size="Large"',
    '  armorClass="18 (back), 16 (front)"',
    '  dex="12"',
    '>',
    'prose',
    '<Statlet kind="creature" armorClass="17 (arcane plate)" dex="16" hitPoints="20">',
    '<Statlet',
    '  armorClass="—"',
    '  hitPoints="—"',
    '>',
  ].join('\n');

  it('writes the three attributes over each AC slot, settled rows first', () => {
    const settled = [{ raw: '18 (back), 16 (front)', ac: 18, dodge: 1, deflect: 7 }];
    expect(applyDefence('src/content/en/monsters/probe.sheet.mdx', sheet, settled)).toBe(
      [
        '<Monster',
        '  size="Large"',
        '  defence="18 (back), 16 (front)"',
        '  deflect="7 (back), 5 (front)"',
        '  dodge="1"',
        '  dex="12"',
        '>',
        'prose',
        '<Statlet kind="creature" defence="17 (arcane plate)" deflect="7" dodge="0" dex="16" hitPoints="20">',
        '<Statlet',
        '  defence="—"',
        '  deflect="—"',
        '  dodge="—"',
        '  hitPoints="—"',
        '>',
      ].join('\n'),
    );
  });

  it('is a no-op once the slots are written', () => {
    const once = applyDefence('src/content/en/monsters/probe.sheet.mdx', sheet, []);
    expect(applyDefence('src/content/en/monsters/probe.sheet.mdx', once, [])).toBe(once);
  });
});
