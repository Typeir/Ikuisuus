/**
 * @fileoverview Party Manager Modal Component
 * @description Modal for creating, editing, deleting, and importing saved parties.
 * Two-view modal: party list view and party editor view.
 * Uses generic Modal component and chip-based member list pattern.
 *
 * @module partyManager
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { Modal } from '@/lib/components/ui/modal/modal';
import type { SavedParty } from '@/lib/types/party';
import { generateId } from '@/lib/utils/encounterStorage';
import {
    deleteParty,
    getSavedParties,
    saveParty,
} from '@/lib/utils/partyStorage';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { PartyEditor } from './partyEditor';
import styles from './partyManager.module.scss';

/**
 * Props for PartyManager component.
 *
 * @interface PartyManagerProps
 * @property {boolean} isOpen - Whether the modal is visible
 * @property {() => void} onClose - Callback when modal should close
 * @property {(party: SavedParty) => void} [onImport] - Callback when importing a party into combat
 */
export interface PartyManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onImport?: (party: SavedParty) => void;
}

/**
 * Party manager modal with list and editor views.
 * Provides CRUD operations for saved parties and optional import-to-combat action.
 *
 * @component
 * @param {PartyManagerProps} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {() => void} props.onClose - Callback when modal should close
 * @param {(party: SavedParty) => void} [props.onImport] - Callback when importing a party
 * @returns {JSX.Element} Rendered party manager modal
 */
export const PartyManager: React.FC<PartyManagerProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const t = useTranslations('encounterPlanner');
  const [parties, setParties] = useState<SavedParty[]>(() => getSavedParties());
  const [editingParty, setEditingParty] = useState<SavedParty | null>(null);

  const refreshParties = useCallback(() => {
    setParties(getSavedParties());
  }, []);

  const handleCreateNew = useCallback(() => {
    setEditingParty({ id: generateId(), name: '', members: [] });
  }, []);

  const handleEdit = useCallback((party: SavedParty) => {
    setEditingParty({
      ...party,
      members: party.members.map((m) => ({ ...m })),
    });
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      deleteParty(id);
      refreshParties();
    },
    [refreshParties],
  );

  const handleSave = useCallback(
    (party: SavedParty) => {
      saveParty(party);
      setEditingParty(null);
      refreshParties();
    },
    [refreshParties],
  );

  const handleBack = useCallback(() => {
    setEditingParty(null);
  }, []);

  const handleImport = useCallback(
    (party: SavedParty) => {
      onImport?.(party);
      onClose();
    },
    [onImport, onClose],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingParty ? t('editParty') : t('manageParties')}
      ariaLabel={t('manageParties')}>
      {editingParty ? (
        <PartyEditor
          party={editingParty}
          onSave={handleSave}
          onBack={handleBack}
        />
      ) : (
        <div className={styles.partyList}>
          {parties.length === 0 && (
            <p className={styles.emptyMessage}>{t('noPartiesSaved')}</p>
          )}
          {parties.map((party) => (
            <div key={party.id} className={styles.partyItem}>
              <div className={styles.partyInfo}>
                <span className={styles.partyName}>{party.name}</span>
                <span className={styles.memberCount}>
                  {party.members.length}
                </span>
              </div>
              <div className={styles.partyActions}>
                {onImport && (
                  <button
                    className={styles.actionButton}
                    onClick={() => handleImport(party)}>
                    {t('importParty')}
                  </button>
                )}
                <button
                  className={styles.actionButton}
                  onClick={() => handleEdit(party)}>
                  {t('editParty')}
                </button>
                <button
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                  onClick={() => handleDelete(party.id)}>
                  {t('deleteParty')}
                </button>
              </div>
            </div>
          ))}
          <button className={styles.buttonPrimary} onClick={handleCreateNew}>
            {t('createParty')}
          </button>
        </div>
      )}
    </Modal>
  );
};
