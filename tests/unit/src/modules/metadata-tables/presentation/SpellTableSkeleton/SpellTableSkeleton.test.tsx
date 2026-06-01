import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SpellTableSkeleton } from '@/modules/metadata-tables/presentation/SpellTableSkeleton/SpellTableSkeleton';

describe('SpellTableSkeleton', () => {
  it('renders skeleton rows', () => {
    render(<SpellTableSkeleton rows={3} tabCount={2} />);
    expect(screen.getAllByRole('row')).toHaveLength(4);
  });
});
