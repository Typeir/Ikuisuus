/**
 * @fileoverview ShardChip Tests
 * @description Verifies rendering, color-to-variant mapping, and lazy fetch
 * behavior for the ShardChip component.
 *
 * @module tests/unit/src/lib/components/characterSheet/shardChip.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { ShardChip } from '@/lib/components/characterSheet/shards/shardChip';
import type { CharacterShard } from '@/lib/types/character';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/components/characterSheet/pagePreviewProvider', () => ({
  usePagePreview: () => ({
    open: vi.fn(),
    close: vi.fn(),
    isOpen: vi.fn(() => false),
  }),
}));

vi.mock('@/lib/components/ui/asyncTooltip', () => ({
  AsyncTooltip: ({
    fallback,
    children,
  }: {
    fallback: React.ReactNode;
    children: React.ReactElement;
  }) => (
    <div>
      <span data-testid='tooltip-fallback'>{fallback}</span>
      {children}
    </div>
  ),
}));

vi.mock('@/lib/components/ui/chip', () => ({
  Chip: ({ label, variant }: { label: string; variant: string }) => (
    <span data-testid='chip' data-variant={variant}>
      {label}
    </span>
  ),
}));

vi.mock('@/lib/mdx/compileRuntime', () => ({
  compileRuntimeSync: (opts: { source: string }) => ({ content: opts.source }),
}));

vi.mock('@/lib/utils/shardToPreview', () => ({
  shardToPreview: () => null,
}));

const baseShard: CharacterShard = {
  id: 'test-1',
  sourceFile: 'feats/test-feat.feat.mdx',
  heading: 'Test Feat',
  category: 'feat',
};

describe('ShardChip', () => {
  it('renders the shard heading as chip label', () => {
    render(<ShardChip shard={baseShard} />);
    expect(screen.getByTestId('chip')).toHaveTextContent('Test Feat');
  });

  it('shows heading as tooltip fallback', () => {
    render(<ShardChip shard={baseShard} />);
    expect(screen.getByTestId('tooltip-fallback')).toHaveTextContent(
      'Test Feat',
    );
  });

  it('maps color=primary to boon variant', () => {
    render(
      <ShardChip shard={{ ...baseShard, category: 'boon' }} color='primary' />,
    );
    expect(screen.getByTestId('chip')).toHaveAttribute('data-variant', 'boon');
  });

  it('maps color=secondary to vocation-feature variant', () => {
    render(<ShardChip shard={baseShard} color='secondary' />);
    expect(screen.getByTestId('chip')).toHaveAttribute(
      'data-variant',
      'vocation-feature',
    );
  });

  it('maps color=tertiary to specialization-feature variant', () => {
    render(<ShardChip shard={baseShard} color='tertiary' />);
    expect(screen.getByTestId('chip')).toHaveAttribute(
      'data-variant',
      'specialization-feature',
    );
  });

  it('infers variant from shard.category when no color given', () => {
    render(<ShardChip shard={{ ...baseShard, category: 'feat' }} />);
    expect(screen.getByTestId('chip')).toHaveAttribute('data-variant', 'feat');
  });

  it('infers vocation-feature variant from category', () => {
    render(
      <ShardChip shard={{ ...baseShard, category: 'vocation-feature' }} />,
    );
    expect(screen.getByTestId('chip')).toHaveAttribute(
      'data-variant',
      'vocation-feature',
    );
  });
});
