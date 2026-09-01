/**
 * @fileoverview OverviewTab Tests
 * @description Smoke test that the overview tab renders for an empty character.
 *
 * @module tests/unit/src/modules/character-builder/presentation/tabs/overviewTab.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { OverviewTab } from '@/modules/character-builder/presentation/tabs/overviewTab';
import { renderWithActiveSheet } from '@tests/setup/renderWithActiveSheet';
import { describe, expect, it } from 'vitest';

describe('OverviewTab', () => {
  it('renders without crashing for an empty character', () => {
    const { container } = renderWithActiveSheet(<OverviewTab />);
    expect(container.firstChild).toBeTruthy();
  });
});
