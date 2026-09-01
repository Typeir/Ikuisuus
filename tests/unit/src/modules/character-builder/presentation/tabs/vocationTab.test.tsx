/**
 * @fileoverview VocationTab Tests
 * @description Smoke tests for the vocation tab — empty state, inner section
 * tabs (Vocation / Specialization), and outer entry tabs for multiclass
 * characters.
 *
 * @module tests/unit/src/modules/character-builder/presentation/tabs/vocationTab.test
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { VocationEntry } from '@/lib/types/character';
import { createEmptyCharacter } from '@/modules/character-builder/lib/utils/characterStorage';
import { VocationTab } from '@/modules/character-builder/presentation/tabs/vocationTab';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithActiveSheet } from '@tests/setup/renderWithActiveSheet';
import { describe, expect, it, vi } from 'vitest';

vi.mock(
  '@/modules/character-builder/presentation/shards/contentShardPanel',
  () => ({
    ContentShardPanel: ({
      contentType,
      slug,
    }: {
      contentType: string;
      slug: string;
    }) => (
      <div
        data-testid='content-shard-panel'
        data-content-type={contentType}
        data-slug={slug}
      />
    ),
  }),
);

const VOC_EMPTY: VocationEntry = {
  slug: '',
  title: '',
  level: 1,
  specializationSlug: null,
  specializationTitle: '',
  vocationFeatures: [],
  specializationFeatures: [],
};

describe('VocationTab', () => {
  it('renders empty state when no vocations are configured', () => {
    renderWithActiveSheet(<VocationTab />);
    expect(screen.getByText('addVocationPrompt')).toBeTruthy();
  });

  it('renders ContentShardPanel for the vocation slug in the Vocation inner tab', () => {
    const data = {
      ...createEmptyCharacter(),
      vocations: [
        {
          ...VOC_EMPTY,
          slug: 'oathbreaker',
          title: 'Oathbreaker',
        },
      ],
    };
    renderWithActiveSheet(<VocationTab />, { character: data });
    const panel = screen.getByTestId('content-shard-panel');
    expect(panel).toHaveAttribute('data-content-type', 'vocations');
    expect(panel).toHaveAttribute('data-slug', 'oathbreaker');
  });

  it('renders the specialization shard panel when switching to the Specialization tab', async () => {
    const data = {
      ...createEmptyCharacter(),
      vocations: [
        {
          ...VOC_EMPTY,
          slug: 'wizard',
          title: 'Wizard',
          specializationSlug: 'abjurer',
          specializationTitle: 'Abjurer',
        },
      ],
    };
    renderWithActiveSheet(<VocationTab />, { character: data });

    const specTab = screen.getByRole('tab', { name: 'Abjurer' });
    await userEvent.click(specTab);

    const panel = screen.getByTestId('content-shard-panel');
    expect(panel).toHaveAttribute('data-content-type', 'specializations');
    expect(panel).toHaveAttribute('data-slug', 'abjurer');
  });

  it('disables the Specialization inner tab when no specialization is selected', () => {
    const data = {
      ...createEmptyCharacter(),
      vocations: [
        {
          ...VOC_EMPTY,
          slug: 'wizard',
          title: 'Wizard',
        },
      ],
    };
    renderWithActiveSheet(<VocationTab />, { character: data });
    const specTab = screen.getByRole('tab', { name: 'specializationFeatures' });
    expect(specTab).toBeDisabled();
  });

  it('renders an outer entry tab strip when multiple vocations exist', () => {
    const data = {
      ...createEmptyCharacter(),
      vocations: [
        {
          ...VOC_EMPTY,
          slug: 'wizard',
          title: 'Wizard',
          specializationSlug: 'abjurer',
          specializationTitle: 'Abjurer',
        },
        {
          ...VOC_EMPTY,
          slug: 'rogue',
          title: 'Rogue',
        },
      ],
    };
    renderWithActiveSheet(<VocationTab />, { character: data });
    expect(screen.getByRole('tab', { name: 'Wizard / Abjurer' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Rogue' })).toBeTruthy();
  });
});
