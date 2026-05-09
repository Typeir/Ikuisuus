/**
 * @fileoverview VocationTab Tests
 * @description Smoke tests for the vocation tab — empty state and ContentShardPanel wiring.
 *
 * @module tests/unit/src/lib/components/characterSheet/tabs/vocationTab
 * @version 1.1.0
 * @author Typeir
 * @since 1.0.0
 */

import { VocationTab } from '@/lib/components/characterSheet/tabs/vocationTab';
import { createEmptyCharacter } from '@/lib/utils/characterStorage';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/components/characterSheet/contentShardPanel', () => ({
  ContentShardPanel: ({
    contentType,
    slug,
    locale,
  }: {
    contentType: string;
    slug: string;
    locale?: string;
  }) => (
    <div
      data-testid='content-shard-panel'
      data-content-type={contentType}
      data-slug={slug}
      data-locale={locale ?? 'en'}
    />
  ),
}));

describe('VocationTab', () => {
  it('renders empty state when no vocation is selected', () => {
    render(<VocationTab data={createEmptyCharacter()} />);
    expect(screen.getByText('selectVocation')).toBeTruthy();
  });

  it('renders ContentShardPanel for the vocation when only vocation is set', () => {
    const data = {
      ...createEmptyCharacter(),
      vocationSlug: 'oathbreaker',
      vocationTitle: 'Oathbreaker',
    };
    render(<VocationTab data={data} locale='en' />);
    const panel = screen.getByTestId('content-shard-panel');
    expect(panel).toHaveAttribute('data-content-type', 'vocations');
    expect(panel).toHaveAttribute('data-slug', 'oathbreaker');
  });
});

