/**
 * @fileoverview ToolsTable Unit Tests
 * @description Tests for the ToolsTable component.
 *
 * @module tests/unit/lib/components/characterSheet/toolsTable
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { CharacterTool } from '@/lib/types/character';
import { ToolsTable } from '@/modules/character-builder/presentation/stats/toolsTable';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

const TOOLS: CharacterTool[] = [
  { name: "Thieves' Tools", proficiency: 'none' },
  { name: 'Smith Tools', proficiency: 'none' },
];

const testMessages = {
  characterSheet: {
    colTool: 'Tool',
    colLevel: 'Level',
    colBonus: 'Bonus',
    ariaToolsTable: 'Tools',
    ariaProfTrack: 'Proficiency Track',
    tools: {
      "Thieves' Tools": "Thieves' Tools",
      'Smith Tools': 'Smith Tools',
    },
  },
};

describe('ToolsTable', () => {
  it('renders all tool rows', () => {
    render(
      <NextIntlClientProvider locale='en' messages={testMessages}>
        <ToolsTable tools={TOOLS} proficiencyBonus={3} onChange={vi.fn()} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText("Thieves' Tools")).toBeTruthy();
    expect(screen.getByText('Smith Tools')).toBeTruthy();
  });

  it('shows correct bonus for non-proficient tool', () => {
    render(
      <NextIntlClientProvider locale='en' messages={testMessages}>
        <ToolsTable tools={TOOLS} proficiencyBonus={3} onChange={vi.fn()} />
      </NextIntlClientProvider>,
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
      <NextIntlClientProvider locale='en' messages={testMessages}>
        <ToolsTable
          tools={toolsWithProf}
          proficiencyBonus={3}
          onChange={vi.fn()}
        />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('+3')).toBeTruthy();
  });

  it('shows correct bonus for familiarity tool', () => {
    const toolsWithFamiliarity: CharacterTool[] = [
      { name: "Thieves' Tools", proficiency: 'familiarity' },
    ];
    render(
      <NextIntlClientProvider locale='en' messages={testMessages}>
        <ToolsTable
          tools={toolsWithFamiliarity}
          proficiencyBonus={3}
          onChange={vi.fn()}
        />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('+1')).toBeTruthy(); // half proficiency
  });

  it('shows correct bonus for expertise tool', () => {
    const toolsWithExpertise: CharacterTool[] = [
      { name: "Thieves' Tools", proficiency: 'expertise' },
    ];
    render(
      <NextIntlClientProvider locale='en' messages={testMessages}>
        <ToolsTable
          tools={toolsWithExpertise}
          proficiencyBonus={3}
          onChange={vi.fn()}
        />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('+6')).toBeTruthy(); // double proficiency
  });

  it('calls onChange when a pip is clicked', async () => {
    const onChange = vi.fn();
    render(
      <NextIntlClientProvider locale='en' messages={testMessages}>
        <ToolsTable
          tools={[{ name: "Thieves' Tools", proficiency: 'none' }]}
          proficiencyBonus={3}
          onChange={onChange}
        />
      </NextIntlClientProvider>,
    );
    const toolRow = screen.getByText("Thieves' Tools").closest('tr');
    const firstPip = toolRow?.querySelector('button');
    await userEvent.click(firstPip!);
    expect(onChange).toHaveBeenCalledOnce();
    const updatedProficiency = onChange.mock.calls[0][0][0].proficiency;
    expect(updatedProficiency).toBe('familiarity');
  });

  it('cycles through proficiency levels with pip clicks', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <NextIntlClientProvider locale='en' messages={testMessages}>
        <ToolsTable
          tools={[{ name: "Thieves' Tools", proficiency: 'none' }]}
          proficiencyBonus={3}
          onChange={onChange}
        />
      </NextIntlClientProvider>,
    );

    // Click pip[0]: none -> familiarity
    let toolRow = screen.getByText("Thieves' Tools").closest('tr');
    let pips = toolRow?.querySelectorAll('button');
    await userEvent.click(pips![0]);
    expect(onChange.mock.calls[0][0][0].proficiency).toBe('familiarity');

    // Click pip[1]: familiarity -> proficient
    onChange.mockClear();
    rerender(
      <NextIntlClientProvider locale='en' messages={testMessages}>
        <ToolsTable
          tools={[{ name: "Thieves' Tools", proficiency: 'familiarity' }]}
          proficiencyBonus={3}
          onChange={onChange}
        />
      </NextIntlClientProvider>,
    );
    toolRow = screen.getByText("Thieves' Tools").closest('tr');
    pips = toolRow?.querySelectorAll('button');
    await userEvent.click(pips![1]);
    expect(onChange.mock.calls[0][0][0].proficiency).toBe('proficient');

    // Click pip[2]: proficient -> expertise
    onChange.mockClear();
    rerender(
      <NextIntlClientProvider locale='en' messages={testMessages}>
        <ToolsTable
          tools={[{ name: "Thieves' Tools", proficiency: 'proficient' }]}
          proficiencyBonus={3}
          onChange={onChange}
        />
      </NextIntlClientProvider>,
    );
    toolRow = screen.getByText("Thieves' Tools").closest('tr');
    pips = toolRow?.querySelectorAll('button');
    await userEvent.click(pips![2]);
    expect(onChange.mock.calls[0][0][0].proficiency).toBe('expertise');

    // Click pip[3]: expertise -> savanthood
    onChange.mockClear();
    rerender(
      <NextIntlClientProvider locale='en' messages={testMessages}>
        <ToolsTable
          tools={[{ name: "Thieves' Tools", proficiency: 'expertise' }]}
          proficiencyBonus={3}
          onChange={onChange}
        />
      </NextIntlClientProvider>,
    );
    toolRow = screen.getByText("Thieves' Tools").closest('tr');
    pips = toolRow?.querySelectorAll('button');
    await userEvent.click(pips![3]);
    expect(onChange.mock.calls[0][0][0].proficiency).toBe('savanthood');
  });

  it('does not call onChange in readOnly mode', async () => {
    const onChange = vi.fn();
    render(
      <NextIntlClientProvider locale='en' messages={testMessages}>
        <ToolsTable
          tools={TOOLS}
          proficiencyBonus={3}
          onChange={onChange}
          readOnly
        />
      </NextIntlClientProvider>,
    );
    const toolRow = screen.getByText("Thieves' Tools").closest('tr');
    const firstPip = toolRow?.querySelector('button');
    await userEvent.click(firstPip!);
    expect(onChange).not.toHaveBeenCalled();
  });
});
