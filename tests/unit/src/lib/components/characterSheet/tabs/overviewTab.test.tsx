/**
 * @fileoverview OverviewTab Tests
 * @description Smoke test that the overview tab renders for an empty character.
 *
 * @module tests/unit/lib/components/characterSheet/tabs/overviewTab
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { OverviewTab } from '@/lib/components/characterSheet/tabs/overviewTab';
import { createEmptyCharacter } from '@/lib/utils/characterStorage';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('OverviewTab', () => {
  it('renders without crashing for an empty character', () => {
    const { container } = render(
      <OverviewTab
        data={createEmptyCharacter()}
        editing={false}
        onChange={() => {}}
      />,
    );
    expect(container.firstChild).toBeTruthy();
  });
});
