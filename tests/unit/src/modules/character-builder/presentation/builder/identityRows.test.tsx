/**
 * @fileoverview IdentityRows Smoke Tests
 * @description Verifies the identity rows component renders without crashing.
 *
 * @module tests/unit/src/modules/character-builder/presentation/builder/identityRows
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { IdentityRows } from '@/modules/character-builder/presentation/builder/identityRows';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock(
  '@/modules/character-builder/presentation/PagePreview/pagePreviewProvider',
  () => ({
    usePagePreview: () => ({
      open: vi.fn(),
      close: vi.fn(),
      isOpen: vi.fn(() => false),
    }),
  }),
);

describe('IdentityRows', () => {
  it('renders bloodline and vocation labels', () => {
    render(
      <IdentityRows
        bloodlineSlug='human'
        bloodlineTitle='Human'
        vocations={[
          {
            slug: 'fighter',
            title: 'Fighter',
            level: 1,
            hitDie: 'd10',
            vocationFeatures: [],
            specializationSlug: null,
            specializationTitle: '',
            specializationFeatures: [],
          },
        ]}
      />,
    );
    expect(screen.getByText('Human')).toBeInTheDocument();
    expect(screen.getByText('Fighter Lv.1')).toBeInTheDocument();
  });

  it('renders empty state when no bloodline', () => {
    const { container } = render(
      <IdentityRows bloodlineSlug={null} bloodlineTitle='' vocations={[]} />,
    );
    expect(container.firstChild).toBeTruthy();
  });
});
