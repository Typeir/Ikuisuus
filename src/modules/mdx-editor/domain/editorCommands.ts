/**
 * @fileoverview Text mutation utilities via execCommand. Preserves native undo/redo.
 *
 * @module modules/mdx-editor/domain/editorCommands
 * @version 1.0.0
 * @author Typeir
 * @since 2.0.0
 */

/**
 * Gets the textarea element and its current selection range.
 *
 * @param {string} id - DOM id
 * @returns {{ el: HTMLTextAreaElement; start: number; end: number } | null}
 */
export function getSelection(
  id: string,
): { el: HTMLTextAreaElement; start: number; end: number } | null {
  const el = document.getElementById(id) as HTMLTextAreaElement | null;
  if (!el) return null;
  return { el, start: el.selectionStart, end: el.selectionEnd };
}

/**
 * Replaces the current selection with new text using `execCommand('insertText')`.
 *
 * @param {HTMLTextAreaElement} el - Textarea element
 * @param {string} text - Text to insert (replaces selection)
 */
export function nativeInsert(el: HTMLTextAreaElement, text: string): void {
  el.focus();
  document.execCommand('insertText', false, text);
}

/**
 * Select range and insert replacement text natively.
 *
 * @param {HTMLTextAreaElement} el - Textarea element
 * @param {number} start - Start of the range to replace
 * @param {number} end - End of the range to replace
 * @param {string} text - Replacement text
 */
export function nativeReplace(
  el: HTMLTextAreaElement,
  start: number,
  end: number,
  text: string,
): void {
  el.focus();
  el.setSelectionRange(start, end);
  document.execCommand('insertText', false, text);
}

/**
 * Replaces the entire editor content natively, preserving the undo stack.
 *
 * @param {string} id - Textarea DOM id
 * @param {string} text - Replacement text
 */
export function replaceAllText(id: string, text: string): void {
  const sel = getSelection(id);
  if (!sel) return;
  nativeReplace(sel.el, 0, sel.el.value.length, text);
}

/**
 * Wraps the selected text with a prefix and suffix, or inserts placeholder text
 * when nothing is selected.
 *
 * @param {string} id - Textarea DOM id
 * @param {string} value - Full editor text
 * @param {string} prefix - Text to insert before selection
 * @param {string} suffix - Text to insert after selection
 * @param {string} placeholder - Placeholder when nothing is selected
 */
export function wrapSelection(
  id: string,
  value: string,
  prefix: string,
  suffix: string,
  placeholder: string,
): void {
  const sel = getSelection(id);
  if (!sel) return;
  const { el, start, end } = sel;
  const selected = value.slice(start, end) || placeholder;
  const replacement = prefix + selected + suffix;
  nativeInsert(el, replacement);
  requestAnimationFrame(() => {
    el.setSelectionRange(
      start + prefix.length,
      start + prefix.length + selected.length,
    );
  });
}

/**
 * Inserts a line prefix (e.g. heading marker) at the start of the current line.
 *
 * @param {string} id - Textarea DOM id
 * @param {string} value - Full editor text
 * @param {string} prefix - Line prefix to prepend
 */
export function insertLinePrefix(
  id: string,
  value: string,
  prefix: string,
): void {
  const sel = getSelection(id);
  if (!sel) return;
  const { el, start } = sel;
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  nativeReplace(el, lineStart, lineStart, prefix);
  requestAnimationFrame(() => {
    const newPos = start + prefix.length;
    el.setSelectionRange(newPos, newPos);
  });
}

/**
 * Inserts text at the current cursor position using native insertion.
 *
 * @param {string} id - Textarea DOM id
 * @param {string} text - Text to insert
 */
export function insertAtCursor(id: string, text: string): void {
  const sel = getSelection(id);
  if (!sel) return;
  const { el } = sel;
  nativeInsert(el, text);
}

/**
 * Inserts a markdown link wrapping the selected text.
 * Places cursor inside the URL placeholder.
 *
 * @param {string} id - Textarea DOM id
 * @param {string} value - Full editor text
 */
export function insertLink(id: string, value: string): void {
  const sel = getSelection(id);
  if (!sel) return;
  const { el, start, end } = sel;
  const selected = value.slice(start, end) || 'text';
  const replacement = `[${selected}](url)`;
  nativeInsert(el, replacement);
  requestAnimationFrame(() => {
    const urlStart = start + selected.length + 3;
    el.setSelectionRange(urlStart, urlStart + 3);
  });
}

/**
 * Duplicates the current line.
 *
 * @param {string} id - Textarea DOM id
 * @param {string} value - Full editor text
 */
export function duplicateLine(id: string, value: string): void {
  const sel = getSelection(id);
  if (!sel) return;
  const { el, start } = sel;
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  let lineEnd = value.indexOf('\n', start);
  if (lineEnd === -1) lineEnd = value.length;
  const line = value.slice(lineStart, lineEnd);
  nativeReplace(el, lineEnd, lineEnd, '\n' + line);
  requestAnimationFrame(() => {
    const newPos = start + line.length + 1;
    el.setSelectionRange(newPos, newPos);
  });
}

/**
 * Triggers undo via execCommand.
 *
 * @param {string} id - Textarea DOM id
 */
export function triggerUndo(id: string): void {
  const sel = getSelection(id);
  if (!sel) return;
  sel.el.focus();
  document.execCommand('undo');
}

/**
 * Triggers redo via execCommand.
 *
 * @param {string} id - Textarea DOM id
 */
export function triggerRedo(id: string): void {
  const sel = getSelection(id);
  if (!sel) return;
  sel.el.focus();
  document.execCommand('redo');
}

/**
 * Handles VS Code-style keyboard shortcuts on the editor textarea.
 * Undo (Ctrl+Z) and Redo (Ctrl+Y / Ctrl+Shift+Z) are handled natively by the browser.
 *
 * @param {React.KeyboardEvent} e - Keyboard event
 * @param {string} textareaId - Textarea DOM id
 * @param {string} value - Current editor content
 */
export function handleEditorKeyDown(
  e: React.KeyboardEvent,
  textareaId: string,
  value: string,
): void {
  const mod = e.ctrlKey || e.metaKey;

  if (mod && e.key === 'b') {
    e.preventDefault();
    wrapSelection(textareaId, value, '**', '**', 'bold');
  } else if (mod && e.key === 'i') {
    e.preventDefault();
    wrapSelection(textareaId, value, '*', '*', 'italic');
  } else if (mod && e.key === 'k') {
    e.preventDefault();
    insertLink(textareaId, value);
  } else if (mod && e.key === '`') {
    e.preventDefault();
    wrapSelection(textareaId, value, '`', '`', 'code');
  } else if (mod && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
    e.preventDefault();
    duplicateLine(textareaId, value);
  }
}
