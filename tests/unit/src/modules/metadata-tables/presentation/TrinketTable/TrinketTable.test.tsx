import TrinketTable from '@/modules/metadata-tables/presentation/TrinketTable/TrinketTable';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
}));

vi.mock(
  '@/modules/metadata-tables/application/hooks/useMetadataTableData',
  () => ({
    useMetadataTableData: vi.fn(() => ({
      data: [],
      loading: false,
      error: null,
    })),
  }),
);

vi.mock('@/lib/components/mdx/metadataTables/metadataTable', () => ({
  default: () => <div>metadata-table</div>,
}));

vi.mock('@/lib/components/mdx/metadataTables/metadataTableSkeleton', () => ({
  MetadataTableSkeleton: () => <div>metadata-skeleton</div>,
}));

describe('TrinketTable', () => {
  it('renders no-data state', () => {
    render(<TrinketTable />);
    expect(screen.getByText('noTrinkets')).toBeInTheDocument();
  });
});
