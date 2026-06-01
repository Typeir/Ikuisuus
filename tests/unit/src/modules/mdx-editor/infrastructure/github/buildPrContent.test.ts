/**
 * @fileoverview Unit tests for branch/commit/PR content builders.
 * @module tests/unit/src/modules/mdx-editor/infrastructure/github/buildPrContent
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import {
    buildBranchName,
    buildCommitMessage,
    buildPrContent,
} from '@/modules/mdx-editor/infrastructure/github/buildPrContent';
import { describe, expect, it } from 'vitest';

describe('buildPrContent helpers', () => {
  it('builds correction commit message by default', () => {
    expect(buildCommitMessage('en/file.mdx', false)).toContain('[correction]');
  });

  it('includes branch action prefix', () => {
    expect(
      buildBranchName('en/world/väärät.mdx', true).startsWith('new/'),
    ).toBe(true);
  });

  it('includes metadata comment in PR body', () => {
    const payload = buildPrContent(
      'en/file.mdx',
      false,
      'sha',
      'alice',
      '127.0.0.1',
    );
    expect(payload.body).toContain('meta:ip=127.0.0.1');
  });
});
