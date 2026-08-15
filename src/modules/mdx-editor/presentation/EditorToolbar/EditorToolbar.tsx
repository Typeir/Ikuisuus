/**
 * @fileoverview MDX Editor Toolbar
 * @description Toolbar with formatting buttons and VS Code-style keyboard shortcuts.
 * Text mutation commands are imported from editorCommands.ts.
 *
 * @module lib/components/mdxEditor/editorToolbar
 * @version 2.0.0
 * @author Typeir
 * @since 2.0.0
 */

'use client';

import type { JSX } from 'react';
import { FilterSelect } from '@/lib/components/ui/filterSelect/filterSelect';
import {
    insertAtCursor,
    insertLinePrefix,
    insertLink,
    replaceAllText,
    triggerRedo,
    triggerUndo,
    wrapSelection,
} from '@/modules/mdx-editor/domain/editorCommands';
import { SAMPLE_TEMPLATES } from '@/modules/mdx-editor/domain/sampleTemplates';
import type { SearchContentType } from '@/modules/search/domain';
import { typeIconMap } from '@/modules/search/presentation/atoms/iconMap';
import {
    Bold,
    Code,
    Copy,
    Heading1,
    Heading2,
    Heading3,
    Italic,
    Link,
    List,
    ListOrdered,
    Minus,
    Quote,
    Redo2,
    Undo2,
} from 'lucide-react';
import styles from './EditorToolbar.module.scss';

export { handleEditorKeyDown } from '@/modules/mdx-editor/domain/editorCommands';

/**
 * @property {string} textareaId - DOM id of the code editor textarea
 * @property {string} value - Current editor content
 * @property {boolean} disabled - Whether the toolbar is inactive
 */
interface EditorToolbarProps {
  /** DOM id of the underlying textarea */
  textareaId: string;
  /** Current editor value (needed for selection/cursor calculations) */
  value: string;
  /** Whether the editor is disabled */
  disabled: boolean;
}

/**
 * Toolbar button descriptor.
 *
 * @property {string} label - Tooltip / aria-label
 * @property {React.ReactNode} icon - Lucide icon element
 * @property {() => void} action - Click handler
 * @property {string} [shortcut] - Keyboard shortcut hint
 */
interface ToolbarButton {
  /** Button tooltip */
  label: string;
  /** Icon element */
  icon: React.ReactNode;
  /** Click handler */
  action: () => void;
  /** Optional shortcut hint */
  shortcut?: string;
}

/**
 * Formatting toolbar for the MDX editor.
 * Provides undo/redo, heading levels, inline formatting, block elements,
 * and shows keyboard shortcut hints on hover.
 *
 * @component
 * @param {EditorToolbarProps} props - Component properties
 * @param {string} props.textareaId - DOM id of the underlying textarea
 * @param {string} props.value - Current editor value
 * @param {boolean} props.disabled - Whether the editor is disabled
 * @returns {JSX.Element} Toolbar strip
 */
export function EditorToolbar({
  textareaId,
  value,
  disabled,
}: EditorToolbarProps): JSX.Element {
  const wrap = (pre: string, suf: string, ph: string) =>
    wrapSelection(textareaId, value, pre, suf, ph);

  const linePrefix = (prefix: string) =>
    insertLinePrefix(textareaId, value, prefix);

  const insert = (text: string) => insertAtCursor(textareaId, text);

  const buttons: (ToolbarButton | 'sep')[] = [
    {
      label: 'Undo',
      icon: <Undo2 size={15} />,
      action: () => triggerUndo(textareaId),
      shortcut: 'Ctrl+Z',
    },
    {
      label: 'Redo',
      icon: <Redo2 size={15} />,
      action: () => triggerRedo(textareaId),
      shortcut: 'Ctrl+Y',
    },
    'sep',
    {
      label: 'Heading 1',
      icon: <Heading1 size={15} />,
      action: () => linePrefix('# '),
    },
    {
      label: 'Heading 2',
      icon: <Heading2 size={15} />,
      action: () => linePrefix('## '),
    },
    {
      label: 'Heading 3',
      icon: <Heading3 size={15} />,
      action: () => linePrefix('### '),
    },
    'sep',
    {
      label: 'Bold',
      icon: <Bold size={15} />,
      action: () => wrap('**', '**', 'bold'),
      shortcut: 'Ctrl+B',
    },
    {
      label: 'Italic',
      icon: <Italic size={15} />,
      action: () => wrap('*', '*', 'italic'),
      shortcut: 'Ctrl+I',
    },
    {
      label: 'Inline code',
      icon: <Code size={15} />,
      action: () => wrap('`', '`', 'code'),
      shortcut: 'Ctrl+`',
    },
    'sep',
    {
      label: 'Link',
      icon: <Link size={15} />,
      action: () => insertLink(textareaId, value),
      shortcut: 'Ctrl+K',
    },
    {
      label: 'Blockquote',
      icon: <Quote size={15} />,
      action: () => linePrefix('> '),
    },
    {
      label: 'Bullet list',
      icon: <List size={15} />,
      action: () => linePrefix('- '),
    },
    {
      label: 'Numbered list',
      icon: <ListOrdered size={15} />,
      action: () => linePrefix('1. '),
    },
    {
      label: 'Horizontal rule',
      icon: <Minus size={15} />,
      action: () => insert('\n---\n'),
    },
  ];

  return (
    <div className={styles.toolbar} role='toolbar' aria-label='Formatting'>
      {buttons.map((btn, i) =>
        btn === 'sep' ? (
          <div key={`sep-${i}`} className={styles.toolbarSep} />
        ) : (
          <button
            key={btn.label}
            type='button'
            className={styles.toolbarButton}
            onClick={btn.action}
            disabled={disabled}
            title={btn.shortcut ? `${btn.label} (${btn.shortcut})` : btn.label}
            aria-label={btn.label}>
            {btn.icon}
          </button>
        ),
      )}
      <div className={styles.toolbarSep} />
      <SampleMenu textareaId={textareaId} disabled={disabled} />
    </div>
  );
}

/**
 * Icons for the sample menu options, borrowed from the search taxonomy so a
 * sample creature wears the same sigil the site uses for monsters.
 */
const SAMPLE_ICONS: Record<string, SearchContentType> = {
  creature: 'monsters',
  heirloom: 'heirlooms',
  spell: 'spells',
  trinket: 'trinkets',
  rule: 'rules',
  world: 'world',
};

/**
 * Sample insertion dropdown built on the FilterSelect atom: choosing a
 * content-type template replaces the whole buffer, undo-ably.
 *
 * @component
 * @param {object} props - Component properties
 * @param {string} props.textareaId - DOM id of the underlying textarea
 * @param {boolean} props.disabled - Whether the toolbar is inactive
 * @returns {JSX.Element} Sample menu
 */
function SampleMenu({
  textareaId,
  disabled,
}: {
  textareaId: string;
  disabled: boolean;
}): JSX.Element {
  const options = SAMPLE_TEMPLATES.map((template) => ({
    value: template.key,
    label: template.label,
  }));

  return (
    <FilterSelect
      value=''
      options={options}
      onChange={(key) => {
        const template = SAMPLE_TEMPLATES.find((t) => t.key === key);
        if (template) replaceAllText(textareaId, template.content);
      }}
      ariaLabel='Insert sample'
      disabled={disabled}
      hideAllOption
      iconTrigger={<Copy size={15} />}
      className={styles.sampleSelect}
      renderOptionLeading={(option) => {
        const Icon = typeIconMap[SAMPLE_ICONS[option.value]];
        return Icon ? <Icon size={14} aria-hidden='true' /> : null;
      }}
    />
  );
}
