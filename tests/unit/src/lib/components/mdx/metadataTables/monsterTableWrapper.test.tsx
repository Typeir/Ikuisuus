/**
 * @fileoverview Unit tests for Monster Table Wrapper component
 * @module tests/unit/src/lib/components/mdx/metadataTables/monsterTableWrapper.test
 * @description Validates MonsterTableWrapper rendering across loading, error,
 * empty, and data states using a mocked useMetadataTableData hook.
 *
 * @version 2.0.0
 * @author Typeir
 *
 * @requires vitest
 * @requires @testing-library/react
 * @requires @/modules/metadata-tables/presentation/MonsterTable/MonsterTable
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
    common: loadMessageFile('messages/en/common.json'),
    tables: loadMessageFile('messages/en/tables.json'),
  }),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/modules/metadata-tables/application/hooks/useMetadataTableData', () => ({
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

import MonsterTableWrapper from '@/modules/metadata-tables/presentation/MonsterTable/MonsterTable';

describe('MonsterTableWrapper', () => {
  beforeEach(() => {
    mockHook.mockReset();
  });

  it('shows skeleton while loading', () => {
    mockHook.mockReturnValue({ data: [], loading: true, error: null });
    render(<MonsterTableWrapper />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('shows error message on failure', () => {
    mockHook.mockReturnValue({
      data: [],
      loading: false,
      error: 'Network error',
    });
    render(<MonsterTableWrapper />);
    expect(screen.getByText(/Network error/)).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    mockHook.mockReturnValue({ data: [], loading: false, error: null });
    render(<MonsterTableWrapper />);
    expect(screen.getByText(/No monsters found\./)).toBeInTheDocument();
    expect(screen.getByText(/generate-monster-metadata/)).toBeInTheDocument();
  });

  it('renders table with monster data', () => {
    mockHook.mockReturnValue({
      data: [
        {
          slug: 'goblin',
          title: 'Goblin',
          size: 'small',
          creatureType: 'humanoid',
          cr: '1/4',
          ac: 15,
          hp: 7,
          alignment: 'neutral evil',
        },
      ],
      loading: false,
      error: null,
    });
    render(<MonsterTableWrapper />);
    expect(screen.getByText('Goblin')).toBeInTheDocument();
    expect(screen.getByText('Small')).toBeInTheDocument();
    expect(screen.getByText('Humanoid')).toBeInTheDocument();
    expect(screen.getByText('1/4')).toBeInTheDocument();
  });

  it('renders ac/hp from object format', () => {
    mockHook.mockReturnValue({
      data: [
        {
          slug: 'dragon',
          title: 'Red Dragon',
          size: 'huge',
          creatureType: 'dragon',
          cr: '20',
          ac: { value: 21, notes: 'natural armor' },
          hp: { average: 367, formula: '21d12+231' },
          alignment: 'chaotic evil',
        },
      ],
      loading: false,
      error: null,
    });
    render(<MonsterTableWrapper />);
    expect(screen.getByText('Red Dragon')).toBeInTheDocument();
    expect(screen.getByText('21')).toBeInTheDocument();
    expect(screen.getByText('367')).toBeInTheDocument();
  });

  it('uses locale from props over route param', () => {
    mockHook.mockReturnValue({ data: [], loading: false, error: null });
    render(<MonsterTableWrapper locale='fi' />);
    expect(mockHook).toHaveBeenCalledWith(
      expect.any(Function),
      'fi',
      'monsters',
    );
  });

  it('capitalises alignment words', () => {
    mockHook.mockReturnValue({
      data: [
        {
          slug: 'angel',
          title: 'Angel',
          size: 'large',
          creatureType: 'celestial',
          cr: '10',
          ac: 17,
          hp: 136,
          alignment: 'lawful good',
        },
      ],
      loading: false,
      error: null,
    });
    render(<MonsterTableWrapper />);
    expect(screen.getByText('Lawful Good')).toBeInTheDocument();
  });
});
