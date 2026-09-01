import { CONTENT_SUBDIRS } from '@/lib/constants/contentPaths';
import { describe, expect, it } from 'vitest';

describe('contentPaths', () => {
  it('maps item kinds under items/', () => {
    expect(CONTENT_SUBDIRS.heirlooms).toBe('items/heirlooms');
    expect(CONTENT_SUBDIRS.trinkets).toBe('items/trinkets');
  });

  it('nests specializations under vocations', () => {
    expect(CONTENT_SUBDIRS.specializations).toBe(CONTENT_SUBDIRS.vocations);
  });

  it('covers every character-creation kind', () => {
    expect(CONTENT_SUBDIRS.feats).toBe('character-creation/feats');
    expect(CONTENT_SUBDIRS.bloodlines).toBe('character-creation/bloodlines');
    expect(CONTENT_SUBDIRS.vocations).toBe('character-creation/vocations');
  });
});
