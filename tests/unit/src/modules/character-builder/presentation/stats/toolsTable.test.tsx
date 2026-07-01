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
  { name: "Thieves' Tools", tier: 'none' },
  { name: 'Smith Tools', tier: 'none' },
];

const testMessages = {
  characterSheet: {
    colTool: 'Tool',
    colLevel: 'Level',
    colBonus: 'Bonus',
    ariaToolsTable: 'Tools',
    ariaTierTrack: 'Proficiency Track',
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
        <ToolsTable tools={TOOLS} tierBonus={3} onChange={vi.fn()} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText("Thieves' Tools")).toBeTruthy();
    expect(screen.getByText('Smith Tools')).toBeTruthy();
  });

  it('shows correct bonus for non-proficient tool', () => {
    render(
      <NextIntlClientProvider locale='en' messages={testMessages}>
        <ToolsTable tools={TOOLS} tierBonus={3} onChange={vi.fn()} />
      </NextIntlClientProvider>,
    );
    const rows = screen.getAllByRole('row');
    const cells = rows[1].querySelectorAll('td');
    expect(cells[cells.length - 1].textContent).toBe('+0');
  });

  it('shows correct bonus for proficient tool', () => {
    const toolsWithProf: CharacterTool[] = [
      { name: 'Smith Tools', tier: 'proficient' },
    ];
    render(
      <NextIntlClientProvider locale='en' messages={testMessages}>
        <ToolsTable
          tools={toolsWithProf}
          tierBonus={3}
          onChange={vi.fn()}
        />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('+3')).toBeTruthy();
  });

  it('shows correct bonus for familiarity tool', () => {
    const toolsWithFamiliarity: CharacterTool[] = [
      { name: "Thieves' Tools", tier: 'familiarity' },
    ];
    render(
      <NextIntlClientProvider locale='en' messages={testMessages}>
        <ToolsTable
          tools={toolsWithFamiliarity}
          tierBonus={3}
          onChange={vi.fn()}
        />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('+1')).toBeTruthy(); // half proficiency
  });

  it('shows correct bonus for expertise tool', () => {
    const toolsWithExpertise: CharacterTool[] = [
      { name: "Thieves' Tools", tier: 'expertise' },
    ];
    render(
      <NextIntlClientProvider locale='en' messages={testMessages}>
        <ToolsTable
          tools={toolsWithExpertise}
          tierBonus={3}
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
          tools={[{ name: "Thieves' Tools", tier: 'none' }]}
          tierBonus={3}
          onChange={onChange}
        />
      </NextIntlClientProvider>,
    );
    const toolRow = screen.getByText("Thieves' Tools").closest('tr');
    const firstPip = toolRow?.querySelector('button');
    await userEvent.click(firstPip!);
    expect(onChange).toHaveBeenCalledOnce();
    const updatedProficiency = onChange.mock.calls[0][0][0].tier;
    expect(updatedProficiency).toBe('familiarity');
  });

  it('cycles through proficiency levels with pip clicks', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <NextIntlClientProvider locale='en' messages={testMessages}>
        <ToolsTable
          tools={[{ name: "Thieves' Tools", tier: 'none' }]}
          tierBonus={3}
          onChange={onChange}
        />
      </NextIntlClientProvider>,
    );

    // Click pip[0]: none -> familiarity
    let toolRow = screen.getByText("Thieves' Tools").closest('tr');
    let pips = toolRow?.querySelectorAll('button');
    await userEvent.click(pips![0]);
    expect(onChange.mock.calls[0][0][0].tier).toBe('familiarity');

    // Click pip[1]: familiarity -> proficient
    onChange.mockClear();
    rerender(
      <NextIntlClientProvider locale='en' messages={testMessages}>
        <ToolsTable
          tools={[{ name: "Thieves' Tools", tier: 'familiarity' }]}
          tierBonus={3}
          onChange={onChange}
        />
      </NextIntlClientProvider>,
    );
    toolRow = screen.getByText("Thieves' Tools").closest('tr');
    pips = toolRow?.querySelectorAll('button');
    await userEvent.click(pips![1]);
    expect(onChange.mock.calls[0][0][0].tier).toBe('proficient');

    // Click pip[2]: proficient -> expertise
    onChange.mockClear();
    rerender(
      <NextIntlClientProvider locale='en' messages={testMessages}>
        <ToolsTable
          tools={[{ name: "Thieves' Tools", tier: 'proficient' }]}
          tierBonus={3}
          onChange={onChange}
        />
      </NextIntlClientProvider>,
    );
    toolRow = screen.getByText("Thieves' Tools").closest('tr');
    pips = toolRow?.querySelectorAll('button');
    await userEvent.click(pips![2]);
    expect(onChange.mock.calls[0][0][0].tier).toBe('expertise');

    // Click pip[3]: expertise -> savanthood
    onChange.mockClear();
    rerender(
      <NextIntlClientProvider locale='en' messages={testMessages}>
        <ToolsTable
          tools={[{ name: "Thieves' Tools", tier: 'expertise' }]}
          tierBonus={3}
          onChange={onChange}
        />
      </NextIntlClientProvider>,
    );
    toolRow = screen.getByText("Thieves' Tools").closest('tr');
    pips = toolRow?.querySelectorAll('button');
    await userEvent.click(pips![3]);
    expect(onChange.mock.calls[0][0][0].tier).toBe('savanthood');
  });

  it('does not call onChange in readOnly mode', async () => {
    const onChange = vi.fn();
    render(
      <NextIntlClientProvider locale='en' messages={testMessages}>
        <ToolsTable
          tools={TOOLS}
          tierBonus={3}
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
t.toHaveBeenCalled();
  });
});
