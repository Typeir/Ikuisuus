/**
 * @fileoverview SkillsTable Unit Tests
 * @description Tests for the SkillsTable component.
 *
 * @module tests/unit/lib/components/characterSheet/skillsTable
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { SkillsTable } from '@/modules/character-builder/presentation/stats/skillsTable';
import type { CharacterSkill } from '@/lib/types/character';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const SKILLS: CharacterSkill[] = [
  { name: 'Acrobatics', ability: 'dex', proficiency: 'none' },
  { name: 'Athletics', ability: 'str', proficiency: 'proficient' },
];

const ABILITY_SCORES = { str: 14, dex: 12, con: 10, int: 10, wis: 10, cha: 10 };

describe('SkillsTable', () => {
  it('renders all skill rows', () => {
    render(
      <SkillsTable
        skills={SKILLS}
        abilityScores={ABILITY_SCORES}
        proficiencyBonus={3}
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
        proficiencyBonus={3}
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
        proficiencyBonus={3}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('+5')).toBeTruthy();
  });

  it('shows correct bonus for familiarity skill', () => {
    const skillsWithFamiliarity: CharacterSkill[] = [
      { name: 'Acrobatics', ability: 'dex', proficiency: 'familiarity' },
    ];
    render(
      <SkillsTable
        skills={skillsWithFamiliarity}
        abilityScores={ABILITY_SCORES}
        proficiencyBonus={3}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('+2')).toBeTruthy(); // dex mod +1, half proficiency +1
  });

  it('shows correct bonus for expertise skill', () => {
    const skillsWithExpertise: CharacterSkill[] = [
      { name: 'Acrobatics', ability: 'dex', proficiency: 'expertise' },
    ];
    render(
      <SkillsTable
        skills={skillsWithExpertise}
        abilityScores={ABILITY_SCORES}
        proficiencyBonus={3}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('+7')).toBeTruthy(); // dex mod +1, double proficiency +6
  });

  it('calls onChange when a skill row is clicked', async () => {
    const onChange = vi.fn();
    render(
      <SkillsTable
        skills={SKILLS}
        abilityScores={ABILITY_SCORES}
        proficiencyBonus={3}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByText('Acrobatics'));
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0][0].proficiency).toBe('familiarity');
  });

  it('cycles through proficiency levels correctly', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <SkillsTable
        skills={SKILLS}
        abilityScores={ABILITY_SCORES}
        proficiencyBonus={3}
        onChange={onChange}
      />,
    );

    // Click 1: none -> familiarity
    await userEvent.click(screen.getByText('Acrobatics'));
    expect(onChange.mock.calls[0][0][0].proficiency).toBe('familiarity');

    // Click 2: familiarity -> proficient
    onChange.mockClear();
    rerender(
      <SkillsTable
        skills={[
          { name: 'Acrobatics', ability: 'dex', proficiency: 'familiarity' },
        ]}
        abilityScores={ABILITY_SCORES}
        proficiencyBonus={3}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByText('Acrobatics'));
    expect(onChange.mock.calls[0][0][0].proficiency).toBe('proficient');

    // Click 3: proficient -> expertise
    onChange.mockClear();
    rerender(
      <SkillsTable
        skills={[
          { name: 'Acrobatics', ability: 'dex', proficiency: 'proficient' },
        ]}
        abilityScores={ABILITY_SCORES}
        proficiencyBonus={3}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByText('Acrobatics'));
    expect(onChange.mock.calls[0][0][0].proficiency).toBe('expertise');

    // Click 4: expertise -> none
    onChange.mockClear();
    rerender(
      <SkillsTable
        skills={[
          { name: 'Acrobatics', ability: 'dex', proficiency: 'expertise' },
        ]}
        abilityScores={ABILITY_SCORES}
        proficiencyBonus={3}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByText('Acrobatics'));
    expect(onChange.mock.calls[0][0][0].proficiency).toBe('none');
  });

  it('does not call onChange in readOnly mode', async () => {
    const onChange = vi.fn();
    render(
      <SkillsTable
        skills={SKILLS}
        abilityScores={ABILITY_SCORES}
        proficiencyBonus={3}
        onChange={onChange}
        readOnly
      />,
    );
    await userEvent.click(screen.getByText('Acrobatics'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
