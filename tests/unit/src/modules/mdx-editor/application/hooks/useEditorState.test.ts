/**
 * @fileoverview Unit Tests — useEditorState
 * @description Validates the editor state machine, initial values, and state transitions.
 *
 * @module tests/unit/lib/components/mdxEditor/useEditorState
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useEditorState } from '@/modules/mdx-editor/application/hooks/useEditorState';

const t = (key: string) => key;

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('useEditorState — initial mode', () => {
  it('starts in "new" mode when no initialSlug is provided', () => {
    const { result } = renderHook(() =>
      useEditorState({ initialSlug: '', initialLocale: 'en', token: null, t }),
    );

    expect(result.current.mode).toBe('new');
  });

  it('starts in "edit" mode when initialSlug is provided', () => {
    const { result } = renderHook(() =>
      useEditorState({
        initialSlug: 'monsters/goblin',
        initialLocale: 'en',
        token: null,
        t,
      }),
    );

    expect(result.current.mode).toBe('edit');
  });
});

describe('useEditorState — initial state values', () => {
  it('has empty content initially', () => {
    const { result } = renderHook(() =>
      useEditorState({ initialSlug: '', initialLocale: 'en', token: null, t }),
    );

    expect(result.current.content).toBe('');
  });

  it('has empty filePath initially', () => {
    const { result } = renderHook(() =>
      useEditorState({ initialSlug: '', initialLocale: 'en', token: null, t }),
    );

    expect(result.current.filePath).toBe('');
  });

  it('initialises slug from initialSlug param', () => {
    const { result } = renderHook(() =>
      useEditorState({
        initialSlug: 'spells/fireball',
        initialLocale: 'en',
        token: 'tkn',
        t,
      }),
    );

    expect(result.current.slug).toBe('spells/fireball');
  });
});

describe('useEditorState — setters', () => {
  it('setContent updates content', async () => {
    const { result } = renderHook(() =>
      useEditorState({ initialSlug: '', initialLocale: 'en', token: null, t }),
    );

    await act(async () => {
      result.current.setContent('new content');
    });

    expect(result.current.content).toBe('new content');
  });

  it('setSlug updates slug', async () => {
    const { result } = renderHook(() =>
      useEditorState({ initialSlug: '', initialLocale: 'en', token: null, t }),
    );

    await act(async () => {
      result.current.setSlug('items/sword');
    });

    expect(result.current.slug).toBe('items/sword');
  });

  it('setFilePath updates filePath', async () => {
    const { result } = renderHook(() =>
      useEditorState({ initialSlug: '', initialLocale: 'en', token: null, t }),
    );

    await act(async () => {
      result.current.setFilePath('en/items/');
    });

    expect(result.current.filePath).toBe('en/items/');
  });
});

describe('useEditorState — canSubmit and editorDisabled', () => {
  it('canSubmit is false when status is idle and mode is edit', () => {
    const { result } = renderHook(() =>
      useEditorState({
        initialSlug: 'monsters/orc',
        initialLocale: 'en',
        token: 'tkn',
        t,
      }),
    );

    expect(result.current.canSubmit).toBe(false);
  });

  it('editorDisabled is false when status phase is idle', () => {
    const { result } = renderHook(() =>
      useEditorState({
        initialSlug: 'monsters/orc',
        initialLocale: 'en',
        token: 'tkn',
        t,
      }),
    );

    expect(result.current.editorDisabled).toBe(false);
  });

  it('editorDisabled is false when mode is new', () => {
    const { result } = renderHook(() =>
      useEditorState({
        initialSlug: '',
        initialLocale: 'en',
        token: 'tkn',
        t,
      }),
    );

    expect(result.current.editorDisabled).toBe(false);
  });
});

describe('useEditorState — handleLoad', () => {
  it('sets status to error when slug is empty on load', async () => {
    const { result } = renderHook(() =>
      useEditorState({ initialSlug: '', initialLocale: 'en', token: 'tkn', t }),
    );

    await act(async () => {
      result.current.handleLoad();
    });

    expect(result.current.status.phase).toBe('error');
  });

  it('calls fetch when slug is non-empty on load', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: '# Hello',
        path: 'en/monsters/goblin.sheet.mdx',
        sha: 'abc123',
        draftCursor: null,
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { result } = renderHook(() =>
      useEditorState({
        initialSlug: 'monsters/goblin',
        initialLocale: 'en',
        token: 'tkn',
        t,
      }),
    );

    await act(async () => {
      result.current.handleLoad();
    });

    expect(mockFetch).toHaveBeenCalled();
  });
});
