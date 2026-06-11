/**
 * @fileoverview Smoke tests for CharacterSheetContext
 * @module tests/unit/src/lib/context/CharacterSheetContext
 */

import { CharacterSheetProvider } from '@/lib/context/CharacterSheetContext';
import { render } from '@testing-library/react';
import { describe, it } from 'vitest';

describe('CharacterSheetContext', () => {
  it('should render provider without crashing', () => {
    render(
      <CharacterSheetProvider>
        <div>Test content</div>
      </CharacterSheetProvider>,
    );
  });
});
