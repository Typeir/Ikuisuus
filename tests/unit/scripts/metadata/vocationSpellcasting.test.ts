/**
 * @fileoverview Vocation spellcasting parser unit tests.
 * @description Covers casting ability and progression detection,
 * specialization slug extraction, archetype labels and feature line ranges.
 *
 * @module tests/unit/scripts/metadata/vocationSpellcasting.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-07
 */

import {
  classifyArchetype,
  classifyProgression,
  findFeatureLineRange,
  parseSpecializations,
  parseSpellcastingAbility,
} from '@scripts/metadata/vocationSpellcasting';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('parseSpellcastingAbility', () => {
  it('reads the bold ability label', () => {
    expect(parseSpellcastingAbility('**Casting ability**: Wisdom')).toBe(
      'Wisdom',
    );
  });

  it('reads reversed and modifier phrasing', () => {
    expect(
      parseSpellcastingAbility('Intelligence is your casting ability'),
    ).toBe('Intelligence');
    expect(
      parseSpellcastingAbility('Spell save DC uses your Charisma modifier'),
    ).toBe('Charisma');
  });

  it('returns null when no ability is declared', () => {
    expect(parseSpellcastingAbility('A martial with no magic.')).toBeNull();
  });
});

describe('classifyProgression', () => {
  it('classifies full, half and third casters from slot headers', () => {
    expect(classifyProgression(['1st', '9th'], 'no pact')).toBe('Full');
    expect(classifyProgression(['1st', '5th'], 'no pact')).toBe('Half');
    expect(classifyProgression(['1st', '2nd', '3rd'], 'no pact')).toBe('Third');
  });

  it('prefers pact magic over slot columns', () => {
    expect(classifyProgression(['1st', '9th'], 'You use Pact Magic.')).toBe(
      'Pact',
    );
  });

  it('returns null without any slot column', () => {
    expect(classifyProgression(['Level', 'Features'], 'no pact')).toBeNull();
  });
});

describe('parseSpecializations', () => {
  it('reads the specialization pages beside the vocation', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'specializations-'));
    await writeFile(join(dir, 'warrior.vocation.mdx'), '# Warrior\n');
    await writeFile(join(dir, 'champion.specialization.mdx'), '# Champion\n');
    await writeFile(join(dir, 'berserker.specialization.mdx'), '# Berserker\n');
    await writeFile(join(dir, 'spells.list.mdx'), '# Spells\n');

    await expect(
      parseSpecializations(join(dir, 'warrior.vocation.mdx')),
    ).resolves.toEqual(['berserker', 'champion']);

    await rm(dir, { recursive: true, force: true });
  });

  it('returns an empty list for a vocation with none written', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'specializations-'));
    await writeFile(join(dir, 'shaman.vocation.mdx'), '# Shaman\n');

    await expect(
      parseSpecializations(join(dir, 'shaman.vocation.mdx')),
    ).resolves.toEqual([]);

    await rm(dir, { recursive: true, force: true });
  });
});

describe('classifyArchetype', () => {
  it('maps progression to archetype labels', () => {
    expect(classifyArchetype(null)).toBe('Martial');
    expect(classifyArchetype('Full')).toBe('Full Caster');
    expect(classifyArchetype('Half')).toBe('Half Caster');
    expect(classifyArchetype('Pact')).toBe('Pact Caster');
    expect(classifyArchetype('Third')).toBe('Third Caster');
  });
});

describe('findFeatureLineRange', () => {
  const LINES = [
    '# Warrior',
    '',
    '## 1st Level – Rage',
    '',
    'You rage.',
    '',
    '### Sub Detail',
    '',
    '## 2nd Level – Reckless Attack',
    '',
    'You attack.',
  ];

  it('locates a feature block and stops at the next equal-level heading', () => {
    expect(findFeatureLineRange(LINES, 'Rage')).toEqual({
      startLine: 3,
      endLine: 7,
      heading: '1st Level – Rage',
    });
  });

  it('returns null when the feature is absent', () => {
    expect(findFeatureLineRange(LINES, 'Spellcasting')).toBeNull();
  });
});
