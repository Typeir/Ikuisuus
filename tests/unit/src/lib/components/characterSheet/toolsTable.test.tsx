/**
 * @fileoverview ToolsTable Unit Tests
 * @description Tests for the ToolsTable component.
 *
 * @module tests/unit/lib/components/characterSheet/toolsTable
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { ToolsTable } from '@/lib/components/characterSheet/toolsTable';
import type { CharacterTool } from '@/lib/types/character';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const TOOLS: CharacterTool[] = [
  { name: "Thieves' Tools", proficiency: 'none' },
  { name: 'Smith Tools', proficiency: 'none' },
];

describe('ToolsTable', () => {
  it('renders all tool rows', () => {
    render(
      <ToolsTable tools={TOOLS} proficiencyBonus={3} onChange={vi.fn()} />,
    );
    expect(screen.getByText("Thieves' Tools")).toBeTruthy();
    expect(screen.getByText('Smith Tools')).toBeTruthy();
  });

  it('shows correct bonus for non-proficient tool', () => {
    render(
      <ToolsTable tools={TOOLS} proficiencyBonus={3} onChange={vi.fn()} />,
    );
    const rows = screen.getAllByRole('row');
    const cells = rows[1].querySelectorAll('td');
    expect(cells[cells.length - 1].textContent).toBe('+0');
  });

  it('shows correct bonus for proficient tool', () => {
    const toolsWithProf: CharacterTool[] = [
      { name: 'Smith Tools', proficiency: 'proficient' },
    ];
    render(
      <ToolsTable
        tools={toolsWithProf}
        proficiencyBonus={3}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('+3')).toBeTruthy();
  });

  it('shows correct bonus for familiarity tool', () => {
    const toolsWithFamiliarity: CharacterTool[] = [
      { name: "Thieves' Tools", proficiency: 'familiarity' },
    ];
    render(
      <ToolsTable
        tools={toolsWithFamiliarity}
        proficiencyBonus={3}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('+1')).toBeTruthy(); // half proficiency
  });

  it('shows correct bonus for expertise tool', () => {
    const toolsWithExpertise: CharacterTool[] = [
      { name: "Thieves' Tools", proficiency: 'expertise' },
    ];
    render(
      <ToolsTable
        tools={toolsWithExpertise}
        proficiencyBonus={3}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('+6')).toBeTruthy(); // double proficiency
  });

  it('calls onChange when a tool row is clicked', async () => {
    const onChange = vi.fn();
    render(
      <ToolsTable
        tools={[{ name: "Thieves' Tools", proficiency: 'none' }]}
        proficiencyBonus={3}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByText("Thieves' Tools"));
    expect(onChange).toHaveBeenCalledOnce();
    const updatedProficiency = onChange.mock.calls[0][0][0].proficiency;
    expect(updatedProficiency).toBe('familiarity');
  });

  it('cycles through proficiency levels correctly', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <ToolsTable tools={TOOLS} proficiencyBonus={3} onChange={onChange} />,
    );

    // Click 1: none -> familiarity
    await userEvent.click(screen.getByText("Thieves' Tools"));
    expect(onChange.mock.calls[0][0][0].proficiency).toBe('familiarity');

    // Click 2: familiarity -> proficient
    onChange.mockClear();
    rerender(
      <ToolsTable
        tools={[{ name: "Thieves' Tools", proficiency: 'familiarity' }]}
        proficiencyBonus={3}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByText("Thieves' Tools"));
    expect(onChange.mock.calls[0][0][0].proficiency).toBe('proficient');

    // Click 3: proficient -> expertise
    onChange.mockClear();
    rerender(
      <ToolsTable
        tools={[{ name: "Thieves' Tools", proficiency: 'proficient' }]}
        proficiencyBonus={3}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByText("Thieves' Tools"));
    expect(onChange.mock.calls[0][0][0].proficiency).toBe('expertise');

    // Click 4: expertise -> none
    onChange.mockClear();
    rerender(
      <ToolsTable
        tools={[{ name: "Thieves' Tools", proficiency: 'expertise' }]}
        proficiencyBonus={3}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByText("Thieves' Tools"));
    expect(onChange.mock.calls[0][0][0].proficiency).toBe('none');
  });

  it('does not call onChange in readOnly mode', async () => {
    const onChange = vi.fn();
    render(
      <ToolsTable
        tools={TOOLS}
        proficiencyBonus={3}
        onChange={onChange}
        readOnly
      />,
    );
    await userEvent.click(screen.getByText("Thieves' Tools"));
    expect(onChange).not.toHaveBeenCalled();
  });
});
