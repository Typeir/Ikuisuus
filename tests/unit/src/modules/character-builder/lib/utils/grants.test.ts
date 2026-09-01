/**
 * @fileoverview Grant utilities tests
 * @description Verifies grant-tag parsing, tier resolution, derivation, and
 * active-grant collection from a character's features.
 *
 * @module tests/unit/src/modules/character-builder/lib/utils/grants.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { CharacterSheet } from '@/lib/types/character';
import {
  collectActiveGrants,
  deriveActiveGrants,
  deriveGrantFloors,
  deriveGrants,
  higherTier,
  parseGrant,
} from '@/modules/character-builder/lib/utils/grants';
import { describe, expect, it } from 'vitest';

describe('parseGrant', () => {
  it('parses a specific grant with default tier proficient', () => {
    expect(parseGrant('weapon:martial')).toEqual({
      kind: 'specific',
      category: 'weapon',
      value: 'martial',
      tier: 'proficient',
    });
  });

  it('parses category:value:tier', () => {
    expect(parseGrant('skill:persuasion:expertise')).toEqual({
      kind: 'specific',
      category: 'skill',
      value: 'persuasion',
      tier: 'expertise',
    });
  });

  it('lowercases and trims each segment', () => {
    expect(parseGrant(' Skill : Persuasion : Expertise ')).toEqual({
      kind: 'specific',
      category: 'skill',
      value: 'persuasion',
      tier: 'expertise',
    });
  });

  it('parses a oneOf choice list', () => {
    expect(parseGrant('skill:[arcana,history,medicine]:expertise')).toEqual({
      kind: 'oneOf',
      category: 'skill',
      options: ['arcana', 'history', 'medicine'],
      tier: 'expertise',
      count: 1,
    });
  });

  it('parses an any grant', () => {
    expect(parseGrant('feat:any')).toEqual({
      kind: 'any',
      category: 'feat',
      tier: 'proficient',
      count: 1,
    });
  });

  it('parses a trailing count on a choice grant', () => {
    expect(parseGrant('skill:any:expertise:2')).toEqual({
      kind: 'any',
      category: 'skill',
      tier: 'expertise',
      count: 2,
    });
  });

  it('parses a wildcard (all) blanket grant', () => {
    expect(parseGrant('skill:*:familiarity')).toEqual({
      kind: 'all',
      category: 'skill',
      tier: 'familiarity',
    });
  });

  it('parses an anyExcept denylist', () => {
    expect(parseGrant('feat:!ability-score-improvement')).toEqual({
      kind: 'anyExcept',
      category: 'feat',
      deny: ['ability-score-improvement'],
      tier: 'proficient',
      count: 1,
    });
    expect(parseGrant('feat:![foo,bar]')).toEqual({
      kind: 'anyExcept',
      category: 'feat',
      deny: ['foo', 'bar'],
      tier: 'proficient',
      count: 1,
    });
  });

  it('rejects an unknown category', () => {
    expect(parseGrant('bogus:thing')).toBeNull();
  });

  it('falls back to proficient on an unknown tier', () => {
    expect(parseGrant('skill:persuasion:legendary')?.tier).toBe('proficient');
  });

  it('rejects malformed tags', () => {
    expect(parseGrant('weapon')).toBeNull();
    expect(parseGrant('a:b:c:d')).toBeNull();
  });
});

describe('parseGrant — hp scalar grants', () => {
  it('parses a resolver reference term with a level scope', () => {
    expect(parseGrant('hp:conMod:level')).toEqual({
      kind: 'value',
      category: 'hp',
      term: { t: 'ref', id: 'conmod' },
      scope: { s: 'level' },
    });
  });

  it('resolves a term reference case-insensitively', () => {
    expect(parseGrant('hp:conMod:level')).toEqual(parseGrant('hp:conmod:level'));
  });

  it('parses signed integer literal terms', () => {
    expect(parseGrant('hp:1:level')).toEqual({
      kind: 'value',
      category: 'hp',
      term: { t: 'lit', v: 1 },
      scope: { s: 'level' },
    });
    expect(parseGrant('hp:-1:level')?.term).toEqual({ t: 'lit', v: -1 });
  });

  it('defaults the scope to once when the third segment is omitted', () => {
    expect(parseGrant('hp:3')).toEqual({
      kind: 'value',
      category: 'hp',
      term: { t: 'lit', v: 3 },
      scope: { s: 'once' },
    });
  });

  it('parses vocation- and specialization-scoped levels with their slug', () => {
    expect(parseGrant('hp:1:level-vocation-scion')).toEqual({
      kind: 'value',
      category: 'hp',
      term: { t: 'lit', v: 1 },
      scope: { s: 'level-vocation', slug: 'scion' },
    });
    expect(
      parseGrant('hp:conScore:level-specialization-draconic-sorcery'),
    ).toEqual({
      kind: 'value',
      category: 'hp',
      term: { t: 'ref', id: 'conscore' },
      scope: { s: 'level-specialization', slug: 'draconic-sorcery' },
    });
  });

  it('rejects an unknown or level-family term reference', () => {
    expect(parseGrant('hp:hpMax:level')).toBeNull();
    expect(parseGrant('hp:level:once')).toBeNull();
    expect(parseGrant('hp:bogus:once')).toBeNull();
  });

  it('rejects an empty term or malformed scope (positional, no segment drop)', () => {
    expect(parseGrant('hp::level')).toBeNull();
    expect(parseGrant('hp:1:level-vocation-')).toBeNull();
    expect(parseGrant('hp:1:bogusscope')).toBeNull();
  });
});

describe('higherTier', () => {
  it('returns the higher tier by cycle order', () => {
    expect(higherTier('proficient', 'expertise')).toBe('expertise');
    expect(higherTier('savanthood', 'familiarity')).toBe('savanthood');
    expect(higherTier('none', 'none')).toBe('none');
  });
});

describe('deriveGrants', () => {
  it('derives each category keeping the highest tier', () => {
    const derived = deriveGrants([
      'skill:persuasion:proficient',
      'skill:persuasion:expertise',
      'trade:smiths:savanthood',
      'saving_throw:dexterity',
      'armor:medium',
      'weapon:martial',
      'weapon:rapier',
    ]);
    expect(derived.skills.persuasion).toBe('expertise');
    expect(derived.trades.smiths).toBe('savanthood');
    expect(derived.savingThrows.dex).toBe('proficient');
    expect(derived.armor).toEqual(['medium']);
    expect(derived.weapons).toEqual(['martial', 'rapier']);
  });

  it('maps ability aliases and ignores unknown save abilities', () => {
    const derived = deriveGrants(['saving_throw:str', 'saving_throw:bogus']);
    expect(derived.savingThrows.str).toBe('proficient');
    expect(Object.keys(derived.savingThrows)).toEqual(['str']);
  });

  it('skips malformed tags', () => {
    const derived = deriveGrants(['', 'weapon', 'skill:persuasion']);
    expect(derived.skills.persuasion).toBe('proficient');
    expect(derived.weapons).toEqual([]);
  });

  it('ignores choice grants (only specific grants floor)', () => {
    const derived = deriveGrants([
      'skill:[arcana,history]:expertise',
      'skill:any:proficient',
      'skill:persuasion:proficient',
    ]);
    expect(derived.skills).toEqual({ persuasion: 'proficient' });
  });
});

describe('collectActiveGrants', () => {
  it('collects grants from level-unlocked features and feats only', () => {
    const character = {
      vocations: [
        {
          level: 3,
          vocationFeatures: [
            { grants: ['weapon:martial'], level: 1 },
            { grants: ['skill:athletics:proficient'], level: 5 },
          ],
          specializationFeatures: [{ grants: ['armor:medium'], level: 2 }],
        },
      ],
      selectedFeats: [{ grants: ['skill:persuasion:expertise'] }],
    } as unknown as CharacterSheet;

    const grants = collectActiveGrants(character);
    expect(grants).toEqual(
      expect.arrayContaining([
        'weapon:martial',
        'armor:medium',
        'skill:persuasion:expertise',
      ]),
    );
    expect(grants).not.toContain('skill:athletics:proficient');
  });
});

describe('deriveActiveGrants', () => {
  it('derives proficiencies from a character’s active features', () => {
    const character = {
      vocations: [
        {
          level: 2,
          vocationFeatures: [{ grants: ['armor:heavy'], level: 1 }],
          specializationFeatures: [],
        },
      ],
      selectedFeats: [],
    } as unknown as CharacterSheet;

    expect(deriveActiveGrants(character).armor).toEqual(['heavy']);
  });
});

describe('deriveGrantFloors', () => {
  it('keys skills/tools by i18n name and saves by ability', () => {
    const character = {
      vocations: [
        {
          level: 5,
          vocationFeatures: [
            {
              grants: ['skill:sleight-of-hand:expertise', 'saving_throw:charisma'],
              level: 1,
            },
          ],
          specializationFeatures: [
            { grants: ['trade:smithing:proficient'], level: 3 },
          ],
        },
      ],
      selectedFeats: [],
    } as unknown as CharacterSheet;

    const floors = deriveGrantFloors(character);
    expect(floors.skills['skills.sleightOfHand']).toBe('expertise');
    expect(floors.tools['tools.smithing']).toBe('proficient');
    expect(floors.savingThrows.cha).toBe('proficient');
  });

  it('floors every skill from a wildcard (all) grant — Jack of All Trades', () => {
    const character = {
      vocations: [
        {
          level: 2,
          vocationFeatures: [
            { grants: ['skill:*:familiarity'], level: 2 },
          ],
          specializationFeatures: [],
        },
      ],
      selectedFeats: [],
      skills: [
        { name: 'skills.arcana', ability: 'int', tier: 'none' },
        { name: 'skills.stealth', ability: 'dex', tier: 'proficient' },
      ],
      tools: [],
    } as unknown as CharacterSheet;

    const floors = deriveGrantFloors(character);
    expect(floors.skills['skills.arcana']).toBe('familiarity');
    expect(floors.skills['skills.stealth']).toBe('familiarity');
  });

  it('folds only the first/primary vocation’s base saving throws into the save floor', () => {
    const character = {
      vocations: [
        {
          level: 1,
          baseSavingThrows: ['Constitution', 'Intelligence'],
          vocationFeatures: [],
          specializationFeatures: [],
        },
        {
          level: 1,
          baseSavingThrows: ['Strength', 'Dexterity'],
          vocationFeatures: [],
          specializationFeatures: [],
        },
      ],
      selectedFeats: [],
    } as unknown as CharacterSheet;

    const floors = deriveGrantFloors(character);
    expect(floors.savingThrows.con).toBe('proficient');
    expect(floors.savingThrows.int).toBe('proficient');
    expect(floors.savingThrows.str).toBeUndefined();
    expect(floors.savingThrows.dex).toBeUndefined();
  });
});
