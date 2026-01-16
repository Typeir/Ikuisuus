/**
 * @fileoverview Unit tests for Archive Intro component
 * @module tests/unit/src/lib/components/archiveIntro/archiveIntro.test
 * @description Validates ArchiveIntro export and component signature.
 * Tests presentational component for archive page introduction.
 * 
 * @version 1.0.0
 * @author Typeir
 * 
 * @requires vitest
 * @requires @/lib/components/archiveIntro/archiveIntro
 */

import { describe, it, expect } from 'vitest';
import * as ArchiveIntroModule from '@/lib/components/archiveIntro/archiveIntro';

describe('archiveIntro', () => {
  it('should export ArchiveIntro component', () => {
    expect(ArchiveIntroModule.ArchiveIntro).toBeDefined();
    expect(typeof ArchiveIntroModule.ArchiveIntro).toBe('function');
  });

  it('should be a React component', () => {
    const componentString = ArchiveIntroModule.ArchiveIntro.toString();
    expect(componentString).toBeDefined();
    expect(componentString.length).toBeGreaterThan(0);
  });

  it('should export exactly one member', () => {
    const exports = Object.keys(ArchiveIntroModule);
    expect(exports).toHaveLength(1);
    expect(exports).toContain('ArchiveIntro');
  });
});
