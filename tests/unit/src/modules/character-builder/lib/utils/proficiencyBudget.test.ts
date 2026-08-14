/**
 * @fileoverview Unit tests for proficiencyBudget utils.
 * @description Covers deriveSkillOffer, countGrantedSkillProficiencies,
 * countSpentSkillProficiencies, countUnspentSkillProficiencies, and
 * deriveProficiencyHints edge cases.
 *
 * @module tests/unit/src/modules/character-builder/lib/utils/proficiencyBudget
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { CharacterSheet, VocationEntry } from '@/lib/types/character';
import {
  countGrantedSkillProficiencies,
  countSpentSkillProficiencies,
  countUnspentSkillProficiencies,
  deriveProficiencyHints,
  deriveSkillOffer,
} from '@/modules/character-builder/lib/utils/proficiencyBudget';
import { describe, expect, it } from 'vitest';

const voc = (over: Partial<VocationEntry>): VocationEntry =>
  ({
    slug: 'v',
    title: 'V',
    level: 1,
    baseSavingThrows: [],
    baseSkillChoiceCount: 0,
    baseSkillChoices: [],
    baseTradeFixed: [],
    specializationSlug: null,
    specializationTitle: '',
    vocationFeatures: [],
    specializationFeatures: [],
    ...over,
  }) as VocationEntry;

const skill = (name: string, tier: string) =>
  ({ name, ability: 'int', tier }) as unknown;

const character = (over: Partial<CharacterSheet>): CharacterSheet =>
  ({
    vocations: [],
    skills: [],
    tools: [],
    selectedFeats: [],
    ...over,
  }) as unknown as CharacterSheet;

describe('deriveSkillOffer', () => {
  it('treats an undefined choices list as "any"', () => {
    const c = character({
      vocations: [voc({ baseSkillChoiceCount: 2, baseSkillChoices: undefined })],
    });
    const offer = deriveSkillOffer(c);
    expect(offer).toMatchObject({ count: 2, any: true });
    expect(offer.keys.size).toBe(0);
  });

  it('treats an empty choices list as "any"', () => {
    const c = character({
      vocations: [voc({ baseSkillChoiceCount: 3, baseSkillChoices: [] })],
    });
    expect(deriveSkillOffer(c).any).toBe(true);
  });

  it('is a restricted offer for a non-empty choices list', () => {
    const c = character({
      vocations: [
        voc({
          baseSkillChoiceCount: 2,
          baseSkillChoices: ['skills.arcana', 'skills.history'],
        }),
      ],
    });
    const offer = deriveSkillOffer(c);
    expect(offer.any).toBe(false);
    expect(offer.keys.has('skills.arcana')).toBe(true);
  });
});

describe('countGrantedSkillProficiencies', () => {
  it('uses the primary (first) vocation count only', () => {
    const c = character({
      vocations: [
        voc({ slug: 'a', baseSkillChoiceCount: 4 }),
        voc({ slug: 'b', baseSkillChoiceCount: 2 }),
      ],
    });
    expect(countGrantedSkillProficiencies(c)).toBe(4);
  });

  it('is 0 with no primary vocation', () => {
    expect(countGrantedSkillProficiencies(character({}))).toBe(0);
  });
});

describe('countSpentSkillProficiencies', () => {
  it('charges only on-offer skills at or above proficient', () => {
    const c = character({
      vocations: [
        voc({
          baseSkillChoiceCount: 2,
          baseSkillChoices: ['skills.arcana', 'skills.history'],
        }),
      ],
      skills: [
        skill('skills.arcana', 'proficient'),
        skill('skills.stealth', 'proficient'),
        skill('skills.history', 'familiarity'),
      ] as never,
    });
    expect(countSpentSkillProficiencies(c)).toBe(1);
  });

  it('charges any proficient skill for an unrestricted offer', () => {
    const c = character({
      vocations: [voc({ baseSkillChoiceCount: 3, baseSkillChoices: [] })],
      skills: [
        skill('skills.stealth', 'proficient'),
        skill('skills.arcana', 'expertise'),
        skill('skills.history', 'none'),
      ] as never,
    });
    expect(countSpentSkillProficiencies(c)).toBe(2);
  });

  it('does not charge a skill a feature grant floor already covers', () => {
    const c = character({
      vocations: [
        voc({
          baseSkillChoiceCount: 2,
          baseSkillChoices: ['skills.arcana', 'skills.history'],
          vocationFeatures: [
            { level: 1, name: 'F', grants: ['skill:arcana:proficient'] },
          ] as never,
        }),
      ],
      skills: [skill('skills.arcana', 'proficient')] as never,
    });
    expect(countSpentSkillProficiencies(c)).toBe(0);
  });
});

describe('countUnspentSkillProficiencies', () => {
  it('clamps at 0 and ignores off-list training raises', () => {
    const c = character({
      vocations: [
        voc({ baseSkillChoiceCount: 2, baseSkillChoices: ['skills.arcana'] }),
      ],
      skills: [
        skill('skills.arcana', 'proficient'),
        skill('skills.stealth', 'proficient'),
        skill('skills.athletics', 'expertise'),
      ] as never,
    });
    expect(countUnspentSkillProficiencies(c)).toBe(1);
  });
});

describe('deriveProficiencyHints', () => {
  it('hints the explicit offer skills and no trades', () => {
    const c = character({
      vocations: [
        voc({
          baseSkillChoiceCount: 2,
          baseSkillChoices: ['skills.arcana', 'skills.history'],
        }),
      ],
    });
    const hints = deriveProficiencyHints(c);
    expect([...hints.skills].sort()).toEqual(['skills.arcana', 'skills.history']);
    expect(hints.trades.size).toBe(0);
  });

  it('hints nothing for an unrestricted (any) offer', () => {
    const c = character({
      vocations: [voc({ baseSkillChoiceCount: 3, baseSkillChoices: [] })],
    });
    expect(deriveProficiencyHints(c).skills.size).toBe(0);
  });
});
