/**
 * @fileoverview VocationTab Tests
 * @description Smoke tests for the vocation tab — empty state, inner section
 * tabs (Vocation / Specialization), and outer entry tabs for multiclass
 * characters.
 *
 * @module tests/unit/src/lib/components/characterSheet/tabs/vocationTab
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { VocationTab } from '@/lib/components/characterSheet/tabs/vocationTab';
import type { VocationEntry } from '@/lib/types/character';
import { createEmptyCharacter } from '@/lib/utils/characterStorage';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/components/characterSheet/contentShardPanel', () => ({
  ContentShardPanel: ({
    contentType,
    slug,
    locale,
  }: {
    contentType: string;
    slug: string;
    locale?: string;
  }) => (
    <div
      data-testid='content-shard-panel'
      data-content-type={contentType}
      data-slug={slug}
      data-locale={locale ?? 'en'}
    />
  ),
}));

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
    render(<VocationTab data={createEmptyCharacter()} />);
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
    render(<VocationTab data={data} locale='en' />);
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
    render(<VocationTab data={data} locale='en' />);

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
    render(<VocationTab data={data} locale='en' />);
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
    render(<VocationTab data={data} locale='en' />);
    expect(screen.getByRole('tab', { name: 'Wizard / Abjurer' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Rogue' })).toBeTruthy();
  });
});
