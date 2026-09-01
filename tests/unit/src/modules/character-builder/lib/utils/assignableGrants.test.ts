/**
 * @fileoverview assignableGrants tests
 * @description Tests collectAssignableGrants, countAssigned, and unassignedByCategory.
 *
 * @module tests/unit/src/modules/character-builder/lib/utils/assignableGrants.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { CharacterSheet, VocationEntry } from '@/lib/types/character';
import {
  collectAssignableGrants,
  countAssigned,
  unassignedByCategory,
  type AssignableGrant,
} from '@/modules/character-builder/lib/utils/assignableGrants';
import { describe, expect, it } from 'vitest';

const voc = (over: Partial<VocationEntry>): VocationEntry =>
  ({
    slug: 'wizard',
    title: 'Wizard',
    level: 20,
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

const featShard = (slug: string) =>
  ({
    id: `feat::${slug}`,
    sourceFile: `character-creation/feats/${slug}.mdx`,
    heading: slug,
    category: 'feat',
  }) as unknown;

const scholarShard = {
  id: 'wizard::2::Scholar',
  heading: 'Scholar',
  level: 2,
  category: 'vocation-feature',
  grants: ['skill:[arcana,history]:expertise'],
} as unknown;

const character = (over: Partial<CharacterSheet>): CharacterSheet =>
  ({
    level: 1,
    experience: 0,
    vocations: [],
    skills: [],
    tools: [],
    selectedFeats: [],
    ...over,
  }) as unknown as CharacterSheet;

const grantOf = (
  grants: AssignableGrant[],
  category: string,
  tier?: string,
): AssignableGrant | undefined =>
  grants.find((g) => g.category === category && g.tier === tier);

describe('collectAssignableGrants', () => {
  it('collects base skill picks as a proficient oneOf grant', () => {
    const c = character({
      vocations: [
        voc({
          baseSkillChoiceCount: 2,
          baseSkillChoices: ['skills.arcana', 'skills.history'],
        }),
      ],
    });
    const grant = grantOf(collectAssignableGrants(c), 'skill', 'proficient');
    expect(grant).toMatchObject({
      count: 2,
      choice: { kind: 'oneOf', options: ['skills.arcana', 'skills.history'] },
      source: 'Wizard',
    });
  });

  it('collects a feature choice grant (Scholar → skill expertise oneOf)', () => {
    const c = character({
      vocations: [voc({ vocationFeatures: [scholarShard] as never })],
    });
    const grant = grantOf(collectAssignableGrants(c), 'skill', 'expertise');
    expect(grant).toMatchObject({
      count: 1,
      source: 'Scholar',
      choice: { kind: 'oneOf', options: ['skills.arcana', 'skills.history'] },
    });
  });

  it('honors a trailing count on a choice grant (Expertise: choose two)', () => {
    const c = character({
      vocations: [
        voc({
          vocationFeatures: [
            {
              id: 'bard::2::Expertise',
              heading: 'Expertise',
              level: 2,
              category: 'vocation-feature',
              grants: ['skill:any:expertise:2'],
            },
          ] as never,
        }),
      ],
    });
    expect(grantOf(collectAssignableGrants(c), 'skill', 'expertise')).toMatchObject(
      { count: 2, choice: { kind: 'any' } },
    );
  });

  it('collects earned feat slots as a feat grant', () => {
    const c = character({
      vocations: [
        voc({
          level: 1,
          vocationFeatures: [{ heading: 'Feat', level: 1 }] as never,
        }),
      ],
    });
    expect(grantOf(collectAssignableGrants(c), 'feat')).toMatchObject({
      count: 1,
      choice: { kind: 'any' },
    });
  });
});

describe('countAssigned', () => {
  const skillGrant: AssignableGrant = {
    id: 'g',
    category: 'skill',
    tier: 'proficient',
    choice: { kind: 'oneOf', options: ['skills.arcana', 'skills.history'] },
    count: 2,
    source: 'Wizard',
  };

  it('counts on-offer skills at or above the tier', () => {
    const c = character({
      vocations: [voc({})],
      skills: [
        skill('skills.arcana', 'proficient'),
        skill('skills.stealth', 'proficient'),
        skill('skills.history', 'familiarity'),
      ] as never,
    });
    expect(countAssigned(skillGrant, c)).toBe(1);
  });

  it('does not count a skill a feature floor already covers', () => {
    const c = character({
      vocations: [
        voc({
          vocationFeatures: [
            { level: 1, grants: ['skill:arcana:proficient'] },
          ] as never,
        }),
      ],
      skills: [skill('skills.arcana', 'proficient')] as never,
    });
    expect(countAssigned(skillGrant, c)).toBe(0);
  });

  it('counts an expertise skill toward an expertise grant', () => {
    const expertiseGrant: AssignableGrant = {
      ...skillGrant,
      tier: 'expertise',
      count: 1,
    };
    const c = character({
      vocations: [voc({})],
      skills: [skill('skills.arcana', 'expertise')] as never,
    });
    expect(countAssigned(expertiseGrant, c)).toBe(1);
  });

  it('counts selected feats for a feat grant', () => {
    const featGrant: AssignableGrant = {
      id: 'f',
      category: 'feat',
      choice: { kind: 'any' },
      count: 2,
      source: '',
    };
    const c = character({ selectedFeats: [featShard('alert')] as never });
    expect(countAssigned(featGrant, c)).toBe(1);
  });
});

describe('feat slot matching (ASI eligibility)', () => {
  const featChar = (feats: string[]): CharacterSheet =>
    character({
      level: 4,
      experience: 0,
      vocations: [
        voc({
          level: 4,
          vocationFeatures: [{ heading: 'Feat', level: 4 }] as never,
        }),
      ],
      selectedFeats: feats.map(featShard) as never,
    });

  it('lets a non-ASI feat fill a tier slot alongside an ASI in the vocation slot', () => {
    const groups = unassignedByCategory(
      featChar(['ability-score-improvement', 'alert']),
    );
    expect(grantOf(groups as never, 'feat')).toBeUndefined();
  });

  it('leaves a tier slot unassigned when only ASI is picked (design lever)', () => {
    const groups = unassignedByCategory(
      featChar(['ability-score-improvement', 'ability-score-improvement']),
    );
    expect(grantOf(groups as never, 'feat')?.count).toBe(1);
  });
});

describe('unassignedByCategory', () => {
  it('reports proficient and expertise groups for a fresh wizard', () => {
    const c = character({
      vocations: [
        voc({
          baseSkillChoiceCount: 2,
          baseSkillChoices: ['skills.arcana', 'skills.history'],
          vocationFeatures: [scholarShard] as never,
        }),
      ],
    });
    const groups = unassignedByCategory(c);
    expect(grantOf(groups as never, 'skill', 'proficient')?.count).toBe(2);
    expect(grantOf(groups as never, 'skill', 'expertise')?.count).toBe(1);
  });

  it('drops a group once fully assigned; expertise also fills a proficient pick', () => {
    const c = character({
      vocations: [
        voc({
          baseSkillChoiceCount: 2,
          baseSkillChoices: ['skills.arcana', 'skills.history'],
          vocationFeatures: [scholarShard] as never,
        }),
      ],
      skills: [skill('skills.arcana', 'expertise')] as never,
    });
    const groups = unassignedByCategory(c);
    expect(grantOf(groups as never, 'skill', 'proficient')?.count).toBe(1);
    expect(grantOf(groups as never, 'skill', 'expertise')).toBeUndefined();
  });
});
