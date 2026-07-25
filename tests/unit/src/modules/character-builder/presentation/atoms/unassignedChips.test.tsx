/**
 * @fileoverview UnassignedChips tests
 * @description Verifies the stack renders one pill per unassigned (category,tier)
 * group the anchor owns (identified by their aria-labels), excludes categories it
 * does not own, and renders nothing when all is assigned.
 *
 * @module tests/unit/src/modules/character-builder/presentation/atoms/unassignedChips
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { CharacterSheet } from '@/lib/types/character';
import { UnassignedChips } from '@/modules/character-builder/presentation/atoms/unassignedChips';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', async (importOriginal) => {
  const { createRealMessageIntlMock } = await import('@tests/setup/intlMock');
  return createRealMessageIntlMock(
    await importOriginal<Record<string, unknown>>(),
  );
});

const SKILL_CATS = ['skill', 'trade'] as const;
const FEAT_CATS = ['feat'] as const;

const character = (over: Partial<CharacterSheet>): CharacterSheet =>
  ({
    level: 1,
    experience: 0,
    vocations: [
      {
        slug: 'wizard',
        title: 'Wizard',
        level: 2,
        baseSkillChoiceCount: 2,
        baseSkillChoices: ['skills.arcana', 'skills.history'],
        baseSavingThrows: [],
        baseTradeFixed: [],
        specializationSlug: null,
        specializationTitle: '',
        vocationFeatures: [
          {
            id: 'wizard::2::Scholar',
            heading: 'Scholar',
            level: 2,
            category: 'vocation-feature',
            grants: ['skill:[arcana,history]:expertise'],
          },
        ],
        specializationFeatures: [],
      },
    ],
    skills: [],
    tools: [],
    selectedFeats: [],
    ...over,
  }) as unknown as CharacterSheet;

describe('UnassignedChips', () => {
  it('renders a pill per unassigned category the anchor owns', () => {
    render(
      <UnassignedChips character={character({})} categories={SKILL_CATS} />,
    );
    expect(screen.getAllByRole('status')).toHaveLength(2);
    expect(
      screen.getByLabelText('Unassigned skill proficiencies'),
    ).toBeTruthy();
    expect(screen.getByLabelText('Unassigned skill expertise')).toBeTruthy();
  });

  it('condenses to one summary pill when there are 3+ groups', () => {
    const c = character({}) as unknown as {
      vocations: { vocationFeatures: unknown[] }[];
    };
    c.vocations[0].vocationFeatures.push({
      id: 'guild',
      heading: 'Guild Ties',
      level: 1,
      category: 'vocation-feature',
      grants: ['trade:[smithing,alchemy]:proficient'],
    });
    render(
      <UnassignedChips
        character={c as unknown as CharacterSheet}
        categories={SKILL_CATS}
      />,
    );
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(
      screen.getByLabelText('Unassigned grants — hover for the breakdown'),
    ).toBeTruthy();
  });

  it('excludes categories the anchor does not own', () => {
    render(
      <UnassignedChips character={character({})} categories={FEAT_CATS} />,
    );
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('renders nothing when every benefit is assigned', () => {
    const assigned = character({
      skills: [
        { name: 'skills.arcana', ability: 'int', tier: 'expertise' },
        { name: 'skills.history', ability: 'int', tier: 'proficient' },
      ] as never,
    });
    render(
      <UnassignedChips character={assigned} categories={SKILL_CATS} />,
    );
    expect(screen.queryByRole('status')).toBeNull();
  });
});
