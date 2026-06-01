/**
 * @fileoverview VocationSelector Unit Tests
 * @description Tests for the VocationSelector component — view mode pills,
 * edit mode FilterSelect comboboxes, multi-vocation (mixing) add/remove,
 * and bloodline change callbacks.
 *
 * @module tests/unit/lib/components/characterSheet/vocationSelector
 * @version 3.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { VocationSelector } from '@/lib/components/characterSheet/builder/vocationSelector';
import type { CharacterSheet as CharacterSheetType, VocationEntry } from '@/lib/types/character';
import { act, render, screen, waitFor } from '@testing-library/react';
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

const mockFetch = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** Empty vocation entry for testing. */
const emptyVocation: VocationEntry = {
  slug: '',
  title: '',
  level: 1,
  specializationSlug: null,
  specializationTitle: '',
  vocationFeatures: [],
  specializationFeatures: [],
};

/** Populated vocation entry for view-mode tests. */
const warriorEntry: VocationEntry = {
  slug: 'warrior',
  title: 'Warrior',
  level: 3,
  specializationSlug: 'champion',
  specializationTitle: 'Champion',
  vocationFeatures: [],
  specializationFeatures: [],
};

/** Default props for a character with nothing selected. */
const defaultProps = {
  bloodlineSlug: null,
  bloodlineTitle: '',
  vocations: [] as VocationEntry[],
  selectedBoons: [],
  boonBudget: 0,
  editing: false,
  onChange: vi.fn(),
};

describe('VocationSelector — view mode', () => {
  it('shows dashes when nothing is selected', () => {
    render(<VocationSelector {...defaultProps} />);
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
  });

  it('shows bloodline pill when bloodline is set', () => {
    render(
      <VocationSelector
        {...defaultProps}
        bloodlineSlug='empyrean'
        bloodlineTitle='Empyrean'
      />,
    );
    expect(screen.getByText('Empyrean')).toBeTruthy();
  });

  it('shows combined vocation/spec/level pill in view mode', () => {
    render(
      <VocationSelector
        {...defaultProps}
        bloodlineSlug='empyrean'
        bloodlineTitle='Empyrean'
        vocations={[warriorEntry]}
      />,
    );
    expect(screen.getByText('Warrior / Champion Lv.3')).toBeTruthy();
  });

  it('does not render FilterSelect triggers in view mode', () => {
    render(<VocationSelector {...defaultProps} />);
    expect(screen.queryByRole('button', { name: /colBloodline/i })).toBeNull();
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

  it('renders bloodline FilterSelect and one vocation entry row in edit mode', async () => {
    render(
      <VocationSelector
        {...defaultProps}
        editing
        vocations={[emptyVocation]}
      />,
    );
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /colBloodline/i })).toBeTruthy();
      expect(screen.getByRole('button', { name: /colVocation/i })).toBeTruthy();
      expect(screen.getByRole('button', { name: /colSpecialization/i })).toBeTruthy();
    });
  });

  it('calls onChange with bloodline patch when bloodline is selected', async () => {
    const onChange = vi.fn();
    render(
      <VocationSelector
        {...defaultProps}
        editing
        vocations={[emptyVocation]}
        onChange={onChange}
      />,
    );
    await waitFor(() => screen.getByRole('button', { name: /colBloodline/i }));

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /colBloodline/i }));
    });
    await act(async () => {
      await userEvent.click(screen.getByRole('option', { name: 'Empyrean' }));
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        bloodlineSlug: 'empyrean',
        bloodlineTitle: 'Empyrean',
        boonBudget: 10,
        selectedBoons: [],
      }),
    );
  });

  it('calls onChange with updated vocations when vocation is changed', async () => {
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
    render(
      <VocationSelector
        {...defaultProps}
        editing
        vocations={[emptyVocation]}
        onChange={onChange}
      />,
    );
    await waitFor(() => screen.getByRole('button', { name: /colVocation/i }));

    await userEvent.click(screen.getByRole('button', { name: /colVocation/i }));
    await userEvent.click(screen.getByRole('option', { name: 'Warrior' }));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
      const call = onChange.mock.calls[0][0] as Partial<CharacterSheetType>;
      expect(call.vocations).toBeDefined();
      expect(call.vocations![0].slug).toBe('warrior');
      expect(call.vocations![0].title).toBe('Warrior');
    });
  });

  it('shows Add Vocation button in edit mode', async () => {
    render(
      <VocationSelector
        {...defaultProps}
        editing
        vocations={[emptyVocation]}
      />,
    );
    await waitFor(() =>
      screen.getByRole('button', { name: /addVocation/i }),
    );
    expect(screen.getByRole('button', { name: /addVocation/i })).toBeTruthy();
  });

  it('calls onChange with a new empty entry when Add Vocation is clicked', async () => {
    const onChange = vi.fn();
    render(
      <VocationSelector
        {...defaultProps}
        editing
        vocations={[emptyVocation]}
        onChange={onChange}
      />,
    );
    await waitFor(() => screen.getByRole('button', { name: /addVocation/i }));

    await userEvent.click(screen.getByRole('button', { name: /addVocation/i }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        vocations: expect.arrayContaining([
          expect.objectContaining({ slug: '', level: 1 }),
          expect.objectContaining({ slug: '', level: 1 }),
        ]),
      }),
    );
  });

  it('disables specialization trigger when vocation entry slug is empty', async () => {
    render(
      <VocationSelector
        {...defaultProps}
        editing
        vocations={[emptyVocation]}
      />,
    );
    await waitFor(() =>
      screen.getByRole('button', { name: /colSpecialization/i }),
    );
    const specBtn = screen.getByRole('button', { name: /colSpecialization/i });
    expect(specBtn).toBeDisabled();
  });
});
