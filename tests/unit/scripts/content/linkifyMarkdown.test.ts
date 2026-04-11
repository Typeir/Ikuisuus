/**
 * @fileoverview Unit tests for markdown linkification behavior.
 * @module tests/unit/scripts/content/linkifyMarkdown
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { describe, expect, it } from 'vitest';
import { linkifyMarkdown } from '../../../../scripts/content/linkifyMarkdown';

describe('linkifyMarkdown', () => {
  it('converts plain terms to markdown links', () => {
    const output = linkifyMarkdown('The ranger tracks prey.', [
      {
        term: 'ranger',
        path: '/en/library/character-creation/vocations/ranger',
      },
      {
        term: 'prey',
        path: '/en/library/character-creation/vocations/ranger/lay-of-the-land#prey',
      },
    ]);

    expect(output).toContain(
      '[ranger](/en/library/character-creation/vocations/ranger)',
    );
    expect(output).toContain(
      '[prey](/en/library/character-creation/vocations/ranger/lay-of-the-land#prey)',
    );
  });

  it('skips creating self-links when selfPath matches', () => {
    const output = linkifyMarkdown(
      'Visit the world index for more lore.',
      [{ term: 'world index', path: '/en/library/world/index' }],
      { selfPath: '/en/library/world/index' },
    );

    expect(output).toBe('Visit the world index for more lore.');
  });
});
