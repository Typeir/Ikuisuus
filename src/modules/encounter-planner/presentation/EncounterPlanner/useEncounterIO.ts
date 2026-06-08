/**
 * @fileoverview Encounter IO handlers — export to clipboard/file, import from file.
 *
 * @module encounter-planner/presentation/EncounterPlanner/useEncounterIO
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { useNotifications } from '@/lib/components/ui';
import { logger } from '@/lib/logging/logger';
import { useTranslations } from 'next-intl';
import React, { useCallback, useRef } from 'react';
import type { Encounter } from '../../domain/encounters/encounter.types';
import {
    exportEncounter,
    importEncounter,
} from '../../infrastructure/persistence/encounterImportExport';
import {
    getEncounters,
    saveEncounter,
    setActiveEncounterId,
} from '../../infrastructure/persistence/encounterRepository';

/**
 * Return shape of useEncounterIO.
 * @interface UseEncounterIOResult
 * @property {React.RefObject<HTMLInputElement | null>} fileInputRef - Ref for the hidden file input
 * @property {() => Promise<void>} handleExport - Copy JSON to clipboard or trigger download
 * @property {() => void} handleImport - Open the hidden file input
 * @property {(e: React.ChangeEvent<HTMLInputElement>) => Promise<void>} handleFileChange - Process selected file
 */
export interface UseEncounterIOResult {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleExport: () => Promise<void>;
  handleImport: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

/**
 * Provides import/export IO handlers for the encounter planner.
 *
 * @function useEncounterIO
 * @param {Encounter | null} encounter - Currently active encounter
 * @param {(enc: Encounter) => void} onImported - Called after a successful file import
 * @returns {UseEncounterIOResult} IO handlers and file input ref
 */
export const useEncounterIO = (
  encounter: Encounter | null,
  onImported: (enc: Encounter) => void,
): UseEncounterIOResult => {
  const t = useTranslations('encounterPlanner');
  const notifications = useNotifications();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExport = useCallback(async () => {
    if (!encounter) return;
    const json = exportEncounter(encounter);
    try {
      await navigator.clipboard.writeText(json);
      notifications.success(t('exportSuccess'));
    } catch {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${encounter.name.replace(/\s+/g, '-').toLowerCase()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [encounter, notifications, t]);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported = importEncounter(text);
        saveEncounter(imported);
        setActiveEncounterId(imported.id);
        getEncounters();
        onImported(imported);
        notifications.success(t('importSuccess'));
      } catch (error) {
        logger.error('Failed to import encounter', {
          error: error instanceof Error ? error.message : String(error),
        });
        notifications.error(t('importError'));
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [notifications, onImported, t],
  );

  return { fileInputRef, handleExport, handleImport, handleFileChange };
};
