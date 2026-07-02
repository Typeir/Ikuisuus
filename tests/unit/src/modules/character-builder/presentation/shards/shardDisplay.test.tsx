/**
 * @fileoverview ShardDisplay Unit Tests
 * @description Tests for the ShardDisplay component.
 *
 * @module tests/unit/lib/components/characterSheet/shardDisplay
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { ShardDisplay } from '@/modules/character-builder/presentation/shards/shardDisplay';
import type { CharacterShard } from '@/lib/types/character';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const SHARD: CharacterShard = {
  id: 'empyrean::Extended Reach',
  sourceFile: 'character-creation/bloodlines/empyrean.bloodline.mdx',
  heading: 'Extended Reach',
  category: 'boon',
  bpCost: 3,
  cachedText: 'Your unarmed reach increases by 5 ft.',
};

describe('ShardDisplay', () => {
  it('renders the heading', () => {
    render(<ShardDisplay shard={SHARD} />);
    expect(screen.getByText('Extended Reach')).toBeTruthy();
  });

  it('shows BP cost badge for boon shards', () => {
    render(<ShardDisplay shard={SHARD} />);
    expect(screen.getByText('3 bpUnit')).toBeTruthy();
  });

  it('shows category label', () => {
    render(<ShardDisplay shard={SHARD} />);
    expect(screen.getByText('shardCategoryBoon')).toBeTruthy();
  });

  it('starts collapsed by default', () => {
    render(<ShardDisplay shard={SHARD} />);
    expect(screen.queryByText('Your unarmed reach')).toBeNull();
  });

  it('calls onExpand when expanding from collapsed', async () => {
    const onExpand = vi.fn();
    render(<ShardDisplay shard={SHARD} onExpand={onExpand} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onExpand).toHaveBeenCalledOnce();
  });

  it('toggles closed on second click', async () => {
    render(<ShardDisplay shard={SHARD} defaultExpanded />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });
});
