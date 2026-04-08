/**
 * @fileoverview Unit tests for Trinket Table Wrapper component
 * @module tests/unit/src/lib/components/mdx/metadataTables/trinketTableWrapper.test
 * @description Validates TrinketTableWrapper rendering across loading, error,
 * empty, and data states with complex render logic (damage + type, conditions).
 *
 * @version 2.0.0
 * @author Typeir
 *
 * @requires vitest
 * @requires @testing-library/react
 * @requires @/lib/components/mdx/metadataTables/trinketTableWrapper
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

import TrinketTableWrapper from '@/lib/components/mdx/metadataTables/trinketTableWrapper';

describe('TrinketTableWrapper', () => {
  beforeEach(() => {
    mockHook.mockReset();
  });

  it('shows skeleton while loading', () => {
    mockHook.mockReturnValue({ data: [], loading: true, error: null });
    render(<TrinketTableWrapper />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('shows error message on failure', () => {
    mockHook.mockReturnValue({
      data: [],
      loading: false,
      error: 'API Error',
    });
    render(<TrinketTableWrapper />);
    expect(screen.getByText(/API Error/)).toBeInTheDocument();
  });

  it('shows empty state', () => {
    mockHook.mockReturnValue({ data: [], loading: false, error: null });
    render(<TrinketTableWrapper />);
    expect(screen.getByText(/No trinkets found\./)).toBeInTheDocument();
    expect(screen.getByText(/generate-trinket-metadata/)).toBeInTheDocument();
  });

  it('renders trinket with damage and damageType', () => {
    mockHook.mockReturnValue({
      data: [
        {
          slug: 'alchemists-fire',
          title: "Alchemist's Fire",
          itemType: 'adventuring gear',
          damage: '1d4',
          damageType: 'fire',
          range: '20',
          weight: '1 lb.',
        },
      ],
      loading: false,
      error: null,
    });
    render(<TrinketTableWrapper />);
    expect(screen.getByText("Alchemist's Fire")).toBeInTheDocument();
    expect(screen.getByText('1d4 fire')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('renders special effects with capitalization', () => {
    mockHook.mockReturnValue({
      data: [
        {
          slug: 'net',
          title: 'Net',
          itemType: 'weapon',
          specialEffects: ['restrain', 'slow'],
          inflictsConditions: ['restrained'],
        },
      ],
      loading: false,
      error: null,
    });
    render(<TrinketTableWrapper />);
    expect(screen.getByText('Net')).toBeInTheDocument();
    expect(screen.getByText('Restrain, Slow')).toBeInTheDocument();
    expect(screen.getByText('Restrained')).toBeInTheDocument();
  });

  it('renders dash for missing optional fields', () => {
    mockHook.mockReturnValue({
      data: [
        {
          slug: 'torch',
          title: 'Torch',
          itemType: 'adventuring gear',
          weight: '1 lb.',
        },
      ],
      loading: false,
      error: null,
    });
    render(<TrinketTableWrapper />);
    expect(screen.getByText('Torch')).toBeInTheDocument();
    const cells = screen.getAllByText('—');
    expect(cells.length).toBeGreaterThanOrEqual(1);
  });

  it('capitalises itemType', () => {
    mockHook.mockReturnValue({
      data: [
        {
          slug: 'oil',
          title: 'Oil',
          itemType: 'adventuring gear',
        },
      ],
      loading: false,
      error: null,
    });
    render(<TrinketTableWrapper />);
    expect(screen.getByText('Adventuring gear')).toBeInTheDocument();
  });

  it('uses locale from props', () => {
    mockHook.mockReturnValue({ data: [], loading: false, error: null });
    render(<TrinketTableWrapper locale='fi' />);
    expect(mockHook).toHaveBeenCalledWith(
      expect.any(Function),
      'fi',
      'trinkets',
    );
  });
});
