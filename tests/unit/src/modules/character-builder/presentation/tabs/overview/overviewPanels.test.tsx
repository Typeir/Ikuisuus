/**
 * @fileoverview Tests for the shared overview panels rendered by desktop and
 * mobile layouts.
 * @description Each panel reads the character from context. Shard clouds omit
 * empty sections.
 *
 * @module tests/unit/src/modules/character-builder/presentation/tabs/overview/overviewPanels
 * @version 1.0.0
 * @author Typeir
 * @since 10.0.0
 */

import type { CharacterShard } from '@/lib/types/character';
import {
    AttacksPanel,
    HintLegend,
    NotesPanel,
    SelectedShardClouds,
    SkillsPanel,
    TradesPanel,
} from '@/modules/character-builder/presentation/tabs/overview/overviewPanels';
import { screen } from '@testing-library/react';
import { renderWithActiveSheet } from '@tests/setup/renderWithActiveSheet';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', async (importOriginal) => {
  const { createRealMessageIntlMock } = await import('@tests/setup/intlMock');
  return createRealMessageIntlMock(
    await importOriginal<Record<string, unknown>>(),
  );
});

const shard = (id: string, heading: string): CharacterShard => ({
  id,
  sourceFile: `src/content/en/${id}.mdx`,
  heading,
  category: 'feat',
});

describe('overview panels', () => {
  it('SkillsPanel renders the skill table from context', () => {
    const { container } = renderWithActiveSheet(<SkillsPanel />);
    expect(container.querySelector('table')).toBeTruthy();
  });

  it('TradesPanel renders the trade table from context', () => {
    const { container } = renderWithActiveSheet(<TradesPanel />);
    expect(container.querySelector('table')).toBeTruthy();
  });

  it('AttacksPanel renders the attacks table from context', () => {
    const { container } = renderWithActiveSheet(<AttacksPanel />);
    expect(container.querySelector('table')).toBeTruthy();
  });

  it('NotesPanel renders the identity prose read-only outside edit mode', () => {
    renderWithActiveSheet(<NotesPanel />, {
      character: { wants: 'A quiet life' },
    });
    expect(screen.getByText('A quiet life')).toBeTruthy();
  });

  it('NotesPanel offers editable fields in edit mode', () => {
    renderWithActiveSheet(<NotesPanel />, {
      character: { wants: 'A quiet life' },
      editing: true,
    });
    expect(screen.getByDisplayValue('A quiet life')).toBeTruthy();
  });

  it('HintLegend renders nothing when no skill carries a hint', () => {
    const { container } = renderWithActiveSheet(<HintLegend />);
    expect(container.firstChild).toBeNull();
  });
});

describe('SelectedShardClouds', () => {
  it('renders nothing when the character has chosen nothing', () => {
    const { container } = renderWithActiveSheet(<SelectedShardClouds />, {
      character: { selectedBoons: [], selectedFeats: [], vocations: [] },
    });
    expect(container.firstChild).toBeNull();
  });

  it('renders a section per non-empty shard group', () => {
    renderWithActiveSheet(<SelectedShardClouds />, {
      character: {
        selectedBoons: [shard('boon-1', 'Extended Reach')],
        selectedFeats: [shard('feat-1', 'Tough')],
        vocations: [],
      },
    });
    expect(screen.getByText('Extended Reach')).toBeTruthy();
    expect(screen.getByText('Tough')).toBeTruthy();
  });

  it('omits features the character has not yet unlocked', () => {
    renderWithActiveSheet(<SelectedShardClouds />, {
      character: {
        selectedBoons: [],
        selectedFeats: [],
        vocations: [
          {
            slug: 'warrior',
            title: 'Warrior',
            level: 2,
            specializationSlug: null,
            specializationTitle: '',
            vocationFeatures: [
              { ...shard('f-1', 'Early Feature'), level: 1 },
              { ...shard('f-9', 'Late Feature'), level: 9 },
            ],
            specializationFeatures: [],
          },
        ],
      },
    });
    expect(screen.getByText('Early Feature')).toBeTruthy();
    expect(screen.queryByText('Late Feature')).toBeNull();
  });
});
