/**
 * @fileoverview VocationSelector Unit Tests
 * @description Tests for the VocationSelector component — view mode pills,
 * edit mode FilterSelect comboboxes, bloodline/vocation/specialization
 * change callbacks with local sharding, and BoonPicker integration.
 *
 * @module tests/unit/lib/components/characterSheet/vocationSelector
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { VocationSelector } from '@/lib/components/characterSheet/vocationSelector';
import type { CharacterSheet as CharacterSheetType } from '@/lib/types/character';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const MOCK_BLOODLINES = [
  {
    slug: 'empyrean',
    title: 'Empyrean',
    file: 'src/content/en/character-creation/bloodlines/empyrean.bloodline.mdx',
    boonBudget: 10,
    boons: [],
  },
];

const MOCK_VOCATIONS = [
  {
    slug: 'warrior',
    title: 'Warrior',
    file: 'src/content/en/vocations/warrior.vocation.mdx',
    features: [{ level: 1, name: 'Fighting Style' }],
  },
];

const MOCK_SPECS = [
  {
    slug: 'champion',
    title: 'Champion',
    file: 'src/content/en/vocations/warrior/champion.mdx',
    vocation: 'warrior',
    features: [{ level: 3, name: 'Improved Critical' }],
  },
];

const MOCK_MDX_SOURCE =
  '# Fighting Style\n\nYou gain a fighting style.\n\n# Improved Critical\n\nCrit on 19-20.';

const mockFetch = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** Default props for a character with nothing selected. */
const defaultProps = {
  bloodlineSlug: null,
  bloodlineTitle: '',
  vocationSlug: null,
  vocationTitle: '',
  specializationSlug: null,
  specializationTitle: '',
  selectedBoons: [],
  boonBudget: 0,
  editing: false,
  onChange: vi.fn(),
};

describe('VocationSelector — view mode', () => {
  it('shows dashes when nothing is selected', () => {
    render(<VocationSelector {...defaultProps} />);
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(3);
  });

  it('shows selected bloodline, vocation, and specialization titles', () => {
    render(
      <VocationSelector
        {...defaultProps}
        bloodlineSlug='empyrean'
        bloodlineTitle='Empyrean'
        vocationSlug='warrior'
        vocationTitle='Warrior'
        specializationSlug='champion'
        specializationTitle='Champion'
      />,
    );
    expect(screen.getByText('Empyrean')).toBeTruthy();
    expect(screen.getByText('Warrior')).toBeTruthy();
    expect(screen.getByText('Champion')).toBeTruthy();
  });

  it('does not render FilterSelect triggers in view mode', () => {
    render(<VocationSelector {...defaultProps} />);
    expect(screen.queryByRole('button', { name: 'colBloodline' })).toBeNull();
  });
});

describe('VocationSelector — edit mode', () => {
  beforeEach(() => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify(MOCK_BLOODLINES), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(MOCK_VOCATIONS), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(MOCK_SPECS), { status: 200 }),
      );
  });

  it('renders three FilterSelect triggers in edit mode', async () => {
    render(<VocationSelector {...defaultProps} editing />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'colBloodline' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'colVocation' })).toBeTruthy();
      expect(
        screen.getByRole('button', { name: 'colSpecialization' }),
      ).toBeTruthy();
    });
  });

  it('calls onChange with bloodline patch when bloodline is selected', async () => {
    const onChange = vi.fn();
    render(<VocationSelector {...defaultProps} editing onChange={onChange} />);
    await waitFor(() => screen.getByRole('button', { name: 'colBloodline' }));

    await userEvent.click(screen.getByRole('button', { name: 'colBloodline' }));
    await userEvent.click(screen.getByRole('option', { name: 'Empyrean' }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        bloodlineSlug: 'empyrean',
        bloodlineTitle: 'Empyrean',
        boonBudget: 10,
        selectedBoons: [],
      }),
    );
  });

  it('calls onChange with vocation patch and feature shards when vocation is selected', async () => {
    const onChange = vi.fn();
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          shardType: 'vocation',
          shards: { 'Fighting Style': 'You gain a fighting style.' },
        }),
        { status: 200 },
      ),
    );
    render(<VocationSelector {...defaultProps} editing onChange={onChange} />);
    await waitFor(() => screen.getByRole('button', { name: 'colVocation' }));

    await userEvent.click(screen.getByRole('button', { name: 'colVocation' }));
    await userEvent.click(screen.getByRole('option', { name: 'Warrior' }));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          vocationSlug: 'warrior',
          vocationTitle: 'Warrior',
          specializationSlug: null,
          specializationTitle: '',
        }),
      );
    });
    const call = onChange.mock.calls[0][0] as Partial<CharacterSheetType>;
    expect(call.vocationFeatures).toHaveLength(1);
    expect(call.vocationFeatures![0].category).toBe('vocation-feature');
    expect(call.vocationFeatures![0].heading).toBe('Fighting Style');
  });

  it('filters specializations to the selected vocation', async () => {
    render(
      <VocationSelector
        {...defaultProps}
        editing
        vocationSlug='warrior'
        vocationTitle='Warrior'
      />,
    );
    await waitFor(() =>
      screen.getByRole('button', { name: 'colSpecialization' }),
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'colSpecialization' }),
    );
    expect(screen.getByRole('option', { name: 'Champion' })).toBeTruthy();
  });

  it('disables specialization trigger when no vocation is selected', async () => {
    render(<VocationSelector {...defaultProps} editing />);
    await waitFor(() =>
      screen.getByRole('button', { name: 'colSpecialization' }),
    );
    const specBtn = screen.getByRole('button', { name: 'colSpecialization' });
    expect(specBtn).toBeDisabled();
  });
});
