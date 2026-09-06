/**
 * @fileoverview Bibliography Tab
 * @description Full-width resizable text block for character backstory,
 * notes, and narrative content.
 *
 * @module modules/character-builder/presentation/tabs/bibliographyTab
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { TextArea } from '@/lib/components/ui/textArea';
import {
    useSheetData,
    useSheetEditing,
    useSheetMutators,
} from '@/modules/character-builder/application/context/activeSheetContext';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import styles from './tabs.module.scss';

/**
 * Bibliography tab content.
 *
 * @component
 * @returns {JSX.Element} Rendered tab body
 */
export const BibliographyTab: React.FC = () => {
  const t = useTranslations('characterSheet');
  const data = useSheetData();
  const editing = useSheetEditing();
  const { patch } = useSheetMutators();

  const handleNotesChange = useCallback(
    (value: string) => {
      patch({ bibliographyNotes: value });
    },
    [patch],
  );

  return (
    <div className={styles.twoColumns}>
      <div className={styles.column} style={{ gridColumn: '1 / -1' }}>
        <TextArea
          className={styles.notesArea}
          value={data.bibliographyNotes ?? ''}
          readOnly={!editing}
          onChange={handleNotesChange}
          placeholder={t('tabBibliography')}
        />
      </div>
    </div>
  );
};
