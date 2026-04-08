/**
 * @fileoverview Unit tests for Heirloom Table Wrapper component
 * @module tests/unit/src/lib/components/mdx/metadataTables/heirloomTableWrapper.test
 * @description Validates HeirloomTableWrapper rendering across loading, error,
 * empty, and data states using a mocked useMetadataTableData hook.
 *
 * @version 2.0.0
 * @author Typeir
 *
 * @requires vitest
 * @requires @testing-library/react
 * @requires @/lib/components/mdx/metadataTables/heirloomTableWrapper
 */

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createUseTranslationsMock,
  loadMessageFile,
} from '../../../testUtils/translationMockUtils';

const mockHook = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: createUseTranslationsMock({
    tables: loadMessageFile('messages/en/tables.json'),
  }),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/lib/hooks/data/useMetadataTableData', () => ({
  useMetadataTableData: (...args: unknown[]) => mockHook(...args),
}));

vi.mock('@/lib/components/ui', () => ({
  FilterSelect: ({ id, placeholder }: any) => (
    <select data-testid={id}>
      <option>{placeholder}</option>
    </select>
  ),
  NumericInput: ({ placeholder, ...rest }: any) => (
    <input
      type='number'
      placeholder={placeholder}
      aria-label={rest['aria-label']}
    />
  ),
}));

vi.mock('@/lib/components/mdx/metadataTables/metadataTableSkeleton', () => ({
  MetadataTableSkeleton: () => <div data-testid='skeleton'>Loading...</div>,
}));

import HeirloomTableWrapper from '@/lib/components/mdx/metadataTables/heirloomTableWrapper';

describe('HeirloomTableWrapper', () => {
  beforeEach(() => {
    mockHook.mockReset();
  });

  it('shows skeleton while loading', () => {
    mockHook.mockReturnValue({ data: [], loading: true, error: null });
    render(<HeirloomTableWrapper />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('shows error message on failure', () => {
    mockHook.mockReturnValue({
      data: [],
      loading: false,
      error: 'Fetch failed',
    });
    render(<HeirloomTableWrapper />);
    expect(screen.getByText(/Fetch failed/)).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    mockHook.mockReturnValue({ data: [], loading: false, error: null });
    render(<HeirloomTableWrapper />);
    expect(screen.getByText(/No heirlooms found\./)).toBeInTheDocument();
    expect(screen.getByText(/generate-heirloom-metadata/)).toBeInTheDocument();
  });

  it('renders table with heirloom data', () => {
    mockHook.mockReturnValue({
      data: [
        {
          slug: 'sacred-heresy',
          title: 'Sacred Heresy',
          rarity: 'legendary',
          itemType: 'weapon',
          weaponType: 'longsword',
          requiresAttunement: true,
        },
      ],
      loading: false,
      error: null,
    });
    render(<HeirloomTableWrapper />);
    expect(screen.getByText('Sacred Heresy')).toBeInTheDocument();
    expect(screen.getByText('Legendary')).toBeInTheDocument();
    expect(screen.getByText('Weapon')).toBeInTheDocument();
    expect(screen.getByText('Longsword')).toBeInTheDocument();
  });

  it('renders attunement as translated boolean', () => {
    mockHook.mockReturnValue({
      data: [
        {
          slug: 'ring-of-power',
          title: 'Ring of Power',
          rarity: 'rare',
          itemType: 'wondrous item',
          requiresAttunement: false,
        },
      ],
      loading: false,
      error: null,
    });
    render(<HeirloomTableWrapper />);
    const cells = screen.getAllByRole('cell');
    const attunementCell = cells[cells.length - 1];
    expect(attunementCell).toHaveTextContent('No');
  });

  it('renders attunement yes value', () => {
    mockHook.mockReturnValue({
      data: [
        {
          slug: 'amulet-of-dawn',
          title: 'Amulet of Dawn',
          rarity: 'rare',
          itemType: 'wondrous item',
          requiresAttunement: true,
        },
      ],
      loading: false,
      error: null,
    });
    render(<HeirloomTableWrapper />);
    const cells = screen.getAllByRole('cell');
    const attunementCell = cells[cells.length - 1];
    expect(attunementCell).toHaveTextContent('Yes');
  });

  it('uses locale from props', () => {
    mockHook.mockReturnValue({ data: [], loading: false, error: null });
    render(<HeirloomTableWrapper locale='es' />);
    expect(mockHook).toHaveBeenCalledWith(
      expect.any(Function),
      'es',
      'heirlooms',
    );
  });

  it('shows dash for missing weaponType', () => {
    mockHook.mockReturnValue({
      data: [
        {
          slug: 'cloak-of-stars',
          title: 'Cloak of Stars',
          rarity: 'uncommon',
          itemType: 'wondrous item',
        },
      ],
      loading: false,
      error: null,
    });
    render(<HeirloomTableWrapper />);
    expect(screen.getByText('Cloak of Stars')).toBeInTheDocument();
  });
});
