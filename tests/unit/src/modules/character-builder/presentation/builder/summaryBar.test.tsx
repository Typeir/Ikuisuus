/**
 * @fileoverview SummaryBar Smoke Tests
 * @description Verifies the summary bar component renders without crashing.
 *
 * @module tests/unit/src/modules/character-builder/presentation/builder/summaryBar
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { SummaryBar } from '@/modules/character-builder/presentation/builder/summaryBar';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('SummaryBar', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <SummaryBar
        collapsed
        onToggle={vi.fn()}
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
    expect(container.firstChild).toBeTruthy();
  });
});
