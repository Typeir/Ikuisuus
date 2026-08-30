/**
 * @fileoverview Abilities Tab
 * @description Card-based grid with import panel (left) separated by a
 * draggable ResizablePane. Wraps in `AbilitiesProvider`.
 *
 * @module lib/components/characterSheet/tabs/abilities/AbilitiesTab
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import type { CharacterAbility } from '@/lib/types/character';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { IconButton } from '@/lib/components/ui/iconButton';
import { BuilderSplitPane } from '../../builder/builderSplitPane';
import styles from './abilities.module.scss';
import { AbilitiesProvider, useAbilities } from './abilitiesContext';
import { AbilityEditor } from './AbilityEditor';
import { AbilityGrid } from './AbilityGrid';
import { AbilityImportPanel } from './AbilityImportPanel';

const AbilitiesBody: React.FC = () => {
  const t = useTranslations('characterSheet');
  const { abilities, editing, mutators } = useAbilities();
  const { addAbility, updateAbility, deleteAbility } = mutators;
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingAbility, setEditingAbility] = useState<CharacterAbility | null>(
    null,
  );

  const handleAdd = useCallback(() => {
    setEditingAbility(null);
    setEditorOpen(true);
  }, []);
  const handleEdit = useCallback(
    (id: string) => {
      setEditingAbility(abilities.find((x) => x.id === id) ?? null);
      setEditorOpen(true);
    },
    [abilities],
  );
  const handleDelete = useCallback(
    (id: string) => {
      deleteAbility(id);
    },
    [deleteAbility],
  );
  const handleSave = useCallback(
    (a: CharacterAbility) => {
      if (editingAbility) updateAbility(a.id, a);
      else addAbility(a);
      setEditorOpen(false);
      setEditingAbility(null);
    },
    [editingAbility, addAbility, updateAbility],
  );
  const handleCancel = useCallback(() => {
    setEditorOpen(false);
    setEditingAbility(null);
  }, []);

  return (
    <BuilderSplitPane
      id='builder.abilities'
      ariaLabel={t('tabAbilities')}
      defaultLeftPercent={30}
      minLeftPercent={22}
      sheetTitle={t('abilityImport')}
      mobileTriggerLabel={t('abilityImport')}
      mobilePrimary='right'
      left={<AbilityImportPanel />}
      right={
        <div className={styles.mainArea}>
          {editing && (
            <IconButton kind='add' onClick={handleAdd} className={styles.addBtn}>
              {t('abilityAdd')}
            </IconButton>
          )}
          <AbilityGrid
            abilities={abilities}
            editing={editing}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          {editorOpen && (
            <AbilityEditor
              existing={editingAbility}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          )}
        </div>
      }
    />
  );
};

export const AbilitiesTab: React.FC = () => (
  <AbilitiesProvider>
    <AbilitiesBody />
  </AbilitiesProvider>
);
