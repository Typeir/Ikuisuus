/**
 * @fileoverview SkillsTable Unit Tests
 * @description Tests for the SkillsTable component.
 *
 * @module tests/unit/lib/components/characterSheet/skillsTable
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { CharacterSkill } from '@/lib/types/character';
import { SkillsTable } from '@/modules/character-builder/presentation/stats/skillsTable';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const SKILLS: CharacterSkill[] = [
  { name: 'Acrobatics', ability: 'dex', tier: 'none' },
  { name: 'Athletics', ability: 'str', tier: 'proficient' },
];

const ABILITY_SCORES = { str: 14, dex: 12, con: 10, int: 10, wis: 10, cha: 10 };

describe('SkillsTable', () => {
  it('renders all skill rows', () => {
    render(
      <SkillsTable
        skills={SKILLS}
        abilityScores={ABILITY_SCORES}
        tierBonus={3}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Acrobatics')).toBeTruthy();
    expect(screen.getByText('Athletics')).toBeTruthy();
  });

  it('shows correct bonus for non-proficient skill', () => {
    render(
      <SkillsTable
        skills={SKILLS}
        abilityScores={ABILITY_SCORES}
        tierBonus={3}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('+1')).toBeTruthy();
  });

  it('shows correct bonus for proficient skill', () => {
    render(
      <SkillsTable
        skills={SKILLS}
        abilityScores={ABILITY_SCORES}
        tierBonus={3}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('+5')).toBeTruthy();
  });

  it('shows correct bonus for familiarity skill', () => {
    const skillsWithFamiliarity: CharacterSkill[] = [
      { name: 'Acrobatics', ability: 'dex', tier: 'familiarity' },
    ];
    render(
      <SkillsTable
        skills={skillsWithFamiliarity}
        abilityScores={ABILITY_SCORES}
        tierBonus={3}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('+2')).toBeTruthy(); // dex mod +1, half proficiency +1
  });

  it('shows correct bonus for expertise skill', () => {
    const skillsWithExpertise: CharacterSkill[] = [
      { name: 'Acrobatics', ability: 'dex', tier: 'expertise' },
    ];
    render(
      <SkillsTable
        skills={skillsWithExpertise}
        abilityScores={ABILITY_SCORES}
        tierBonus={3}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('+7')).toBeTruthy(); // dex mod +1, double proficiency +6
  });

  it('calls onChange when a pip is clicked', async () => {
    const onChange = vi.fn();
    render(
      <SkillsTable
        skills={SKILLS}
        abilityScores={ABILITY_SCORES}
        tierBonus={3}
        onChange={onChange}
      />,
    );
    const acrobaticsRow = screen.getByText('Acrobatics').closest('tr');
    const firstPip = acrobaticsRow?.querySelector('button');
    await userEvent.click(firstPip!);
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0][0].tier).toBe('familiarity');
  });

  it('cycles through proficiency levels with pip clicks', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <SkillsTable
        skills={SKILLS}
        abilityScores={ABILITY_SCORES}
        tierBonus={3}
        onChange={onChange}
      />,
    );

    // Click 1: none -> familiarity (first pip)
    let acrobaticsRow = screen.getByText('Acrobatics').closest('tr');
    let pips = acrobaticsRow?.querySelectorAll('button');
    await userEvent.click(pips![0]);
    expect(onChange.mock.calls[0][0][0].tier).toBe('familiarity');

    // Click 2: familiarity -> proficient (second pip)
    onChange.mockClear();
    rerender(
      <SkillsTable
        skills={[
          { name: 'Acrobatics', ability: 'dex', tier: 'familiarity' },
        ]}
        abilityScores={ABILITY_SCORES}
        tierBonus={3}
        onChange={onChange}
      />,
    );
    acrobaticsRow = screen.getByText('Acrobatics').closest('tr');
    pips = acrobaticsRow?.querySelectorAll('button');
    await userEvent.click(pips![1]);
    expect(onChange.mock.calls[0][0][0].tier).toBe('proficient');

    // Click 3: proficient -> expertise (third pip)
    onChange.mockClear();
    rerender(
      <SkillsTable
        skills={[
          { name: 'Acrobatics', ability: 'dex', tier: 'proficient' },
        ]}
        abilityScores={ABILITY_SCORES}
        tierBonus={3}
        onChange={onChange}
      />,
    );
    acrobaticsRow = screen.getByText('Acrobatics').closest('tr');
    pips = acrobaticsRow?.querySelectorAll('button');
    await userEvent.click(pips![2]);
    expect(onChange.mock.calls[0][0][0].tier).toBe('expertise');

    // Click 4: expertise -> savanthood (fourth pip)
    onChange.mockClear();
    rerender(
      <SkillsTable
        skills={[
          { name: 'Acrobatics', ability: 'dex', tier: 'expertise' },
        ]}
        abilityScores={ABILITY_SCORES}
        tierBonus={3}
        onChange={onChange}
      />,
    );
    acrobaticsRow = screen.getByText('Acrobatics').closest('tr');
    pips = acrobaticsRow?.querySelectorAll('button');
    await userEvent.click(pips![3]);
    expect(onChange.mock.calls[0][0][0].tier).toBe('savanthood');
  });

  it('does not call onChange in readOnly mode', async () => {
    const onChange = vi.fn();
    render(
      <SkillsTable
        skills={SKILLS}
        abilityScores={ABILITY_SCORES}
        tierBonus={3}
        onChange={onChange}
        readOnly
      />,
    );
    await userEvent.click(screen.getByText('Acrobatics'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
