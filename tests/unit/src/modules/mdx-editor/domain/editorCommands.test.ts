/**
 * @fileoverview Editor Commands Unit Tests
 * @description Tests for execCommand-based textarea mutations: selection,
 * wrapping, prefix insertion, link insertion, line duplication, and keyboard
 * shortcut dispatch.
 */

import {
    duplicateLine,
    getSelection,
    handleEditorKeyDown,
    insertAtCursor,
    insertLinePrefix,
    insertLink,
    nativeInsert,
    nativeReplace,
    triggerRedo,
    triggerUndo,
    wrapSelection,
} from '@/modules/mdx-editor/domain/editorCommands';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Creates a mock textarea element with the given value and selection range.
 */
function createMockTextarea(
  id: string,
  value: string,
  selStart: number,
  selEnd: number,
): HTMLTextAreaElement {
  const el = document.createElement('textarea');
  el.id = id;
  el.value = value;
  el.selectionStart = selStart;
  el.selectionEnd = selEnd;
  document.body.appendChild(el);
  return el;
}

describe('editorCommands', () => {
  let rafCallbacks: (() => void)[];

  beforeEach(() => {
    rafCallbacks = [];
    document.execCommand = vi.fn().mockReturnValue(true);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallbacks.push(cb as () => void);
      return rafCallbacks.length;
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('getSelection', () => {
    it('should return element and selection range for valid id', () => {
      createMockTextarea('editor', 'hello world', 3, 7);
      const result = getSelection('editor');

      expect(result).not.toBeNull();
      expect(result!.el.id).toBe('editor');
      expect(result!.start).toBe(3);
      expect(result!.end).toBe(7);
    });

    it('should return null for non-existent id', () => {
      const result = getSelection('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('nativeInsert', () => {
    it('should focus the element and call execCommand with insertText', () => {
      const el = createMockTextarea('editor', 'hello', 0, 0);
      const focusSpy = vi.spyOn(el, 'focus');

      nativeInsert(el, 'world');

      expect(focusSpy).toHaveBeenCalled();
      expect(document.execCommand).toHaveBeenCalledWith(
        'insertText',
        false,
        'world',
      );
    });
  });

  describe('nativeReplace', () => {
    it('should focus, set selection range, then insert text', () => {
      const el = createMockTextarea('editor', 'hello world', 0, 5);
      const focusSpy = vi.spyOn(el, 'focus');
      const rangeSpy = vi.spyOn(el, 'setSelectionRange');

      nativeReplace(el, 2, 8, 'replaced');

      expect(focusSpy).toHaveBeenCalled();
      expect(rangeSpy).toHaveBeenCalledWith(2, 8);
      expect(document.execCommand).toHaveBeenCalledWith(
        'insertText',
        false,
        'replaced',
      );
    });
  });

  describe('wrapSelection', () => {
    it('should wrap selected text with prefix and suffix', () => {
      createMockTextarea('editor', 'hello world', 6, 11);

      wrapSelection('editor', 'hello world', '**', '**', 'bold');

      expect(document.execCommand).toHaveBeenCalledWith(
        'insertText',
        false,
        '**world**',
      );
    });

    it('should use placeholder when nothing is selected', () => {
      createMockTextarea('editor', 'hello', 5, 5);

      wrapSelection('editor', 'hello', '**', '**', 'bold');

      expect(document.execCommand).toHaveBeenCalledWith(
        'insertText',
        false,
        '**bold**',
      );
    });

    it('should set selection range to inner text after rAF', () => {
      const el = createMockTextarea('editor', 'hello world', 6, 11);
      const rangeSpy = vi.spyOn(el, 'setSelectionRange');

      wrapSelection('editor', 'hello world', '**', '**', 'bold');
      rafCallbacks.forEach((cb) => cb());

      expect(rangeSpy).toHaveBeenCalledWith(8, 13);
    });

    it('should do nothing when element does not exist', () => {
      wrapSelection('nonexistent', 'hello', '**', '**', 'bold');
      expect(document.execCommand).not.toHaveBeenCalled();
    });
  });

  describe('insertLinePrefix', () => {
    it('should insert prefix at start of the current line', () => {
      const el = createMockTextarea('editor', 'first\nsecond\nthird', 8, 8);
      const rangeSpy = vi.spyOn(el, 'setSelectionRange');

      insertLinePrefix('editor', 'first\nsecond\nthird', '## ');

      expect(document.execCommand).toHaveBeenCalledWith(
        'insertText',
        false,
        '## ',
      );
      rafCallbacks.forEach((cb) => cb());
      expect(rangeSpy).toHaveBeenCalledWith(11, 11);
    });

    it('should handle first line (no preceding newline)', () => {
      createMockTextarea('editor', 'hello', 3, 3);

      insertLinePrefix('editor', 'hello', '# ');

      expect(document.execCommand).toHaveBeenCalledWith(
        'insertText',
        false,
        '# ',
      );
    });

    it('should do nothing when element does not exist', () => {
      insertLinePrefix('nonexistent', 'hello', '# ');
      expect(document.execCommand).not.toHaveBeenCalled();
    });
  });

  describe('insertAtCursor', () => {
    it('should insert text at cursor position', () => {
      createMockTextarea('editor', 'hello', 5, 5);

      insertAtCursor('editor', ' world');

      expect(document.execCommand).toHaveBeenCalledWith(
        'insertText',
        false,
        ' world',
      );
    });

    it('should do nothing when element does not exist', () => {
      insertAtCursor('nonexistent', 'text');
      expect(document.execCommand).not.toHaveBeenCalled();
    });
  });

  describe('insertLink', () => {
    it('should wrap selected text in markdown link syntax', () => {
      createMockTextarea('editor', 'click here', 6, 10);

      insertLink('editor', 'click here');

      expect(document.execCommand).toHaveBeenCalledWith(
        'insertText',
        false,
        '[here](url)',
      );
    });

    it('should use "text" placeholder when nothing selected', () => {
      createMockTextarea('editor', 'hello', 5, 5);

      insertLink('editor', 'hello');

      expect(document.execCommand).toHaveBeenCalledWith(
        'insertText',
        false,
        '[text](url)',
      );
    });

    it('should select the url placeholder after rAF', () => {
      const el = createMockTextarea('editor', 'hello', 5, 5);
      const rangeSpy = vi.spyOn(el, 'setSelectionRange');

      insertLink('editor', 'hello');
      rafCallbacks.forEach((cb) => cb());

      expect(rangeSpy).toHaveBeenCalledWith(12, 15);
    });

    it('should do nothing when element does not exist', () => {
      insertLink('nonexistent', 'hello');
      expect(document.execCommand).not.toHaveBeenCalled();
    });
  });

  describe('duplicateLine', () => {
    it('should duplicate the current line below', () => {
      createMockTextarea('editor', 'first\nsecond\nthird', 8, 8);

      duplicateLine('editor', 'first\nsecond\nthird');

      expect(document.execCommand).toHaveBeenCalledWith(
        'insertText',
        false,
        '\nsecond',
      );
    });

    it('should handle last line without trailing newline', () => {
      createMockTextarea('editor', 'first\nsecond', 10, 10);

      duplicateLine('editor', 'first\nsecond');

      expect(document.execCommand).toHaveBeenCalledWith(
        'insertText',
        false,
        '\nsecond',
      );
    });

    it('should do nothing when element does not exist', () => {
      duplicateLine('nonexistent', 'hello');
      expect(document.execCommand).not.toHaveBeenCalled();
    });
  });

  describe('triggerUndo', () => {
    it('should call execCommand undo', () => {
      createMockTextarea('editor', 'hello', 0, 0);

      triggerUndo('editor');

      expect(document.execCommand).toHaveBeenCalledWith('undo');
    });

    it('should do nothing when element does not exist', () => {
      triggerUndo('nonexistent');
      expect(document.execCommand).not.toHaveBeenCalled();
    });
  });

  describe('triggerRedo', () => {
    it('should call execCommand redo', () => {
      createMockTextarea('editor', 'hello', 0, 0);

      triggerRedo('editor');

      expect(document.execCommand).toHaveBeenCalledWith('redo');
    });

    it('should do nothing when element does not exist', () => {
      triggerRedo('nonexistent');
      expect(document.execCommand).not.toHaveBeenCalled();
    });
  });

  describe('handleEditorKeyDown', () => {
    /**
     * Creates a mock keyboard event with the specified properties.
     */
    function createKeyEvent(
      key: string,
      opts: { ctrl?: boolean; shift?: boolean } = {},
    ): React.KeyboardEvent {
      return {
        key,
        ctrlKey: opts.ctrl ?? false,
        metaKey: false,
        shiftKey: opts.shift ?? false,
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;
    }

    it('should wrap with bold on Ctrl+B', () => {
      createMockTextarea('editor', 'hello world', 6, 11);
      const e = createKeyEvent('b', { ctrl: true });

      handleEditorKeyDown(e, 'editor', 'hello world');

      expect(e.preventDefault).toHaveBeenCalled();
      expect(document.execCommand).toHaveBeenCalledWith(
        'insertText',
        false,
        '**world**',
      );
    });

    it('should wrap with italic on Ctrl+I', () => {
      createMockTextarea('editor', 'hello world', 6, 11);
      const e = createKeyEvent('i', { ctrl: true });

      handleEditorKeyDown(e, 'editor', 'hello world');

      expect(e.preventDefault).toHaveBeenCalled();
      expect(document.execCommand).toHaveBeenCalledWith(
        'insertText',
        false,
        '*world*',
      );
    });

    it('should insert link on Ctrl+K', () => {
      createMockTextarea('editor', 'hello', 0, 5);
      const e = createKeyEvent('k', { ctrl: true });

      handleEditorKeyDown(e, 'editor', 'hello');

      expect(e.preventDefault).toHaveBeenCalled();
      expect(document.execCommand).toHaveBeenCalledWith(
        'insertText',
        false,
        '[hello](url)',
      );
    });

    it('should wrap with backticks on Ctrl+`', () => {
      createMockTextarea('editor', 'code here', 0, 4);
      const e = createKeyEvent('`', { ctrl: true });

      handleEditorKeyDown(e, 'editor', 'code here');

      expect(e.preventDefault).toHaveBeenCalled();
      expect(document.execCommand).toHaveBeenCalledWith(
        'insertText',
        false,
        '`code`',
      );
    });

    it('should duplicate line on Ctrl+Shift+D', () => {
      createMockTextarea('editor', 'hello\nworld', 8, 8);
      const e = createKeyEvent('D', { ctrl: true, shift: true });

      handleEditorKeyDown(e, 'editor', 'hello\nworld');

      expect(e.preventDefault).toHaveBeenCalled();
      expect(document.execCommand).toHaveBeenCalledWith(
        'insertText',
        false,
        '\nworld',
      );
    });

    it('should not call preventDefault for non-shortcut key', () => {
      createMockTextarea('editor', 'hello', 0, 0);
      const e = createKeyEvent('a', { ctrl: false });

      handleEditorKeyDown(e, 'editor', 'hello');

      expect(e.preventDefault).not.toHaveBeenCalled();
    });
  });
});
