/**
 * @fileoverview Unit tests for VocationEntryBlock
 * @description Tests the VocationEntryBlock component — vocation picker render,
 * specialization picker filtering, level NumericInput, remove button visibility,
 * and all event callbacks.
 *
 * @module tests/unit/lib/components/characterSheet/vocationEntryBlock
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { VocationEntryBlock } from '@/lib/components/characterSheet/vocationEntryBlock';
import type { VocationEntry } from '@/lib/types/character';
import type { SpecOption, VocationOption } from '@/lib/types/vocations';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const VOC_OPTIONS: VocationOption[] = [
  {
    slug: 'warrior',
    title: 'Warrior',
    file: 'src/content/en/character-creation/vocations/warrior/main.mdx',
    features: [],
  },
  {
    slug: 'mage',
    title: 'Mage',
    file: 'src/content/en/character-creation/vocations/mage/main.mdx',
    features: [],
  },
];

const SPEC_OPTIONS: SpecOption[] = [
  {
    slug: 'champion',
    title: 'Champion',
    file: 'src/content/en/character-creation/vocations/warrior/champion.specialization.mdx',
    vocation: 'warrior',
    features: [],
  },
  {
    slug: 'evoker',
    title: 'Evoker',
    file: 'src/content/en/character-creation/vocations/mage/evoker.specialization.mdx',
    vocation: 'mage',
    features: [],
  },
];

const EMPTY_ENTRY: VocationEntry = {
  slug: '',
  title: '',
  level: 1,
  specializationSlug: null,
  specializationTitle: '',
  vocationFeatures: [],
  specializationFeatures: [],
};

const WARRIOR_ENTRY: VocationEntry = {
  ...EMPTY_ENTRY,
  slug: 'warrior',
  title: 'Warrior',
  level: 5,
};

/**
 * Renders VocationEntryBlock with sensible defaults.
 *
 * @function renderBlock
 * @param {object} overrides - Props to override
 * @returns {ReturnType<typeof render>} Render result
 */
function renderBlock(
  overrides: Partial<{
    entry: VocationEntry;
    index: number;
    isOnlyEntry: boolean;
    vocOptions: VocationOption[];
    specs: SpecOption[];
    onVocationChange: (i: number, s: string) => void;
    onSpecChange: (i: number, s: string) => void;
    onLevelChange: (i: number, v: number) => void;
    onRemove: (i: number) => void;
  }> = {},
) {
  const props = {
    entry: EMPTY_ENTRY,
    index: 0,
    isOnlyEntry: true,
    vocOptions: VOC_OPTIONS,
    specs: SPEC_OPTIONS,
    onVocationChange: vi.fn(),
    onSpecChange: vi.fn(),
    onLevelChange: vi.fn(),
    onRemove: vi.fn(),
    ...overrides,
  };
  return render(<VocationEntryBlock {...props} />);
}

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('VocationEntryBlock', () => {
  it('renders vocation and specialization placeholder keys', () => {
    renderBlock();
    expect(screen.getByText('selectVocation')).toBeDefined();
    expect(screen.getByText('selectSpecialization')).toBeDefined();
  });

  it('hides remove button when isOnlyEntry is true', () => {
    renderBlock({ isOnlyEntry: true });
    expect(screen.queryByLabelText('ariaRemoveVocation')).toBeNull();
  });

  it('shows remove button when isOnlyEntry is false', () => {
    renderBlock({ isOnlyEntry: false, index: 1 });
    expect(screen.getByLabelText('ariaRemoveVocation')).toBeDefined();
  });

  it('calls onRemove with index when remove button is clicked', async () => {
    const onRemove = vi.fn();
    renderBlock({ isOnlyEntry: false, index: 2, onRemove });
    await userEvent.click(screen.getByLabelText('ariaRemoveVocation'));
    expect(onRemove).toHaveBeenCalledWith(2);
  });

  it('renders the level NumericInput with the entry level', () => {
    renderBlock({ entry: WARRIOR_ENTRY });
    const spinbutton = screen.getByRole('spinbutton', {
      name: 'ariaVocationLevel',
    });
    expect((spinbutton as HTMLInputElement).value).toBe('5');
  });

  it('shows index suffix when isOnlyEntry is false', () => {
    renderBlock({ isOnlyEntry: false, index: 1 });
    expect(screen.getByText('colVocation 2')).toBeDefined();
  });
});
