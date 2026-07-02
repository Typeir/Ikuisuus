/**
 * @fileoverview Bibliography Tab
 * @description Full-width resizable text block for character backstory,
 * notes, and narrative content. Uses the `notes` field from the character
 * sheet.
 *
 * @module lib/components/characterSheet/tabs/bibliographyTab
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { TextArea } from '@/lib/components/ui/textArea';
import type { CharacterSheet as CharacterSheetType } from '@/lib/types/character';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import styles from './tabs.module.scss';

/**
 * Props for `<BibliographyTab>`.
 *
 * @interface BibliographyTabProps
 * @property {CharacterSheetType} data - Active character data
 * @property {boolean} editing - Whether edit mode is active
 * @property {(patch: Partial<CharacterSheetType>) => void} onChange - Patch the draft
 */
export interface BibliographyTabProps {
  data: CharacterSheetType;
  editing: boolean;
  onChange: (patch: Partial<CharacterSheetType>) => void;
}

/**
 * Bibliography tab content. Renders the character's notes as a large
 * resizable text area.
 *
 * @component
 * @param {BibliographyTabProps} props - Component props
 * @returns {JSX.Element} Rendered tab body
 */
export const BibliographyTab: React.FC<BibliographyTabProps> = ({
  data,
  editing,
  onChange,
}) => {
  const t = useTranslations('characterSheet');

  const handleNotesChange = useCallback(
    (value: string) => {
      onChange({ notes: value } as Partial<CharacterSheetType>);
    },
    [onChange],
  );

  return (
    <div className={styles.twoColumns}>
      <div className={styles.column} style={{ gridColumn: '1 / -1' }}>
        <TextArea
          className={styles.notesArea}
          value={data.notes ?? ''}
          readOnly={!editing}
          onChange={handleNotesChange}
          placeholder={t('tabBibliography')}
        />
      </div>
    </div>
  );
};
