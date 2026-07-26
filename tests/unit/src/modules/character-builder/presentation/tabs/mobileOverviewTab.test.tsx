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

import { MobileOverviewTab } from '@/modules/character-builder/presentation/tabs/mobileOverviewTab';
import { renderWithActiveSheet } from '@tests/setup/renderWithActiveSheet';
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
    const { container } = renderWithActiveSheet(
      <MobileOverviewTab boonShards={[]} featShards={[]} featureShards={[]} />,
    );
    expect(container.firstChild).toBeTruthy();
  });
});
