/**
 * @fileoverview MobileOverviewTab Smoke Tests
 * @description Verifies the mobile overview tab renders without crashing
 * for an empty character sheet.
 *
 * @module tests/unit/src/modules/character-builder/presentation/tabs/mobileOverviewTab
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { createEmptyCharacter } from '@/modules/character-builder/lib/utils/characterStorage';
import { MobileOverviewTab } from '@/modules/character-builder/presentation/tabs/mobileOverviewTab';
import { render } from '@testing-library/react';
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

describe('MobileOverviewTab', () => {
  it('renders without crashing for an empty character', () => {
    const data = createEmptyCharacter();
    const { container } = render(
      <MobileOverviewTab
        data={data}
        editing={false}
        onChange={vi.fn()}
        onSkillsChange={vi.fn()}
        onToolsChange={vi.fn()}
        onAttacksChange={vi.fn()}
        onNotesChange={vi.fn()}
        boonShards={[]}
        featShards={[]}
        featureShards={[]}
      />,
    );
    expect(container.firstChild).toBeTruthy();
  });
});
