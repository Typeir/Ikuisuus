/**
 * @fileoverview Notes Section Component
 * @description Renders the character narrative fields:
 * wants, fears, flaws, virtues, bonds, and miscellaneous notes.
 * Each field is a textarea; changes are batched through a single onChange callback.
 *
 * @module lib/components/characterSheet/notesSection
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { TextArea } from '@/lib/components/ui/textArea';
import { useTranslations } from 'next-intl';
import { memo } from 'react';
import styles from '../CharacterSheet/characterSheetWidgets.module.scss';

/**
 * Shape of the notes data managed by this component.
 *
 * @interface NoteFields
 * @property {string} wants - What the character wants
 * @property {string} fears - What the character fears
 * @property {string} virtues - Character virtues
 * @property {string} flaws - Character flaws
 * @property {string} bonds - Bonds
 * @property {string} notes - Miscellaneous notes
 */
export interface NoteFields {
  wants: string;
  fears: string;
  virtues: string;
  flaws: string;
  bonds: string;
  notes: string;
}

/**
 * Props for the NotesSection component.
 *
 * @interface NotesSectionProps
 * @property {NoteFields} values - Current note field values
 * @property {(values: NoteFields) => void} onChange - Callback when any field changes
 * @property {boolean} [readOnly] - When true, renders static text instead of textareas
 */
export interface NotesSectionProps {
  values: NoteFields;
  onChange: (values: NoteFields) => void;
  readOnly?: boolean;
}

/** Ordered list of note field keys for rendering. */
const NOTE_FIELD_KEYS: (keyof NoteFields)[] = [
  'wants',
  'fears',
  'virtues',
  'flaws',
  'bonds',
  'notes',
];

/**
 * Narrative notes panel with labelled textareas for each character personality field.
 *
 * @component
 * @param {NotesSectionProps} props - Component props
 * @returns {JSX.Element} Rendered notes section
 */
export const NotesSectionImpl: React.FC<NotesSectionProps> = ({
  values,
  onChange,
  readOnly = false,
}) => {
  const handleChange = (key: keyof NoteFields, value: string) => {
    onChange({ ...values, [key]: value });
  };
  const t = useTranslations('characterSheet');

  return (
    <section
      className={styles.notesSection}
      aria-label={t('ariaCharacterNotes')}>
      {NOTE_FIELD_KEYS.map((key) => (
        <div key={key} className={styles.noteField}>
          {readOnly ? (
            <>
              <span className={styles.noteLabel}>{t(key)}</span>
              <p className={styles.noteText}>{values[key] || '—'}</p>
            </>
          ) : (
            <>
              <label className={styles.noteLabel} htmlFor={`note-${key}`}>
                {t(key)}
              </label>
              <TextArea
                id={`note-${key}`}
                className={styles.noteTextarea}
                value={values[key]}
                onChange={(v) => handleChange(key, v)}
                rows={3}
              />
            </>
          )}
        </div>
      ))}
    </section>
  );
};

/**
 * Memoized `NotesSection` export. Re-renders only when `values`, `onChange`,
 * or `readOnly` change by reference.
 */
export const NotesSection = memo(NotesSectionImpl);
