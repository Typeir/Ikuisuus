/**
 * @fileoverview Reader preferences modal.
 * @description Text scale, article measure, constrained hue, the two section
 * decorators, a second theme control, immersive mode, and the unit switcher.
 *
 * @module lib/components/preferences/PreferencesModal
 * @version 1.1.0
 * @author Typeir
 * @since 9.0.0
 */

'use client';

import { Modal } from '@/lib/components/ui/modal';
import { NumericInput } from '@/lib/components/ui/numericInput/numericInput';
import { useImmersiveMode } from '@/lib/components/viewport/useImmersiveMode';
import {
  useDisplayPrefsActions,
  useDisplayPrefsState,
} from '@/lib/context/PersistentUiContext';
import {
  DEFAULT_PROSE_MEASURE,
  DEFAULT_TEXT_SCALE,
} from '@/lib/types/persistentUiState';
import { PipCheckbox } from '@/modules/character-builder/presentation/components/PipCheckbox';
import UnitSwitcher from '@/modules/library/presentation/components/UnitSwitcher/UnitSwitcher';
import { useTranslations } from 'next-intl';
import type { JSX } from 'react';
import { ThemeToggleButton } from '../themeToggle/ThemeToggleButton';
import styles from './PreferencesModal.module.scss';

/**
 * Percentage a reader types, over the multiplier the stylesheet consumes.
 *
 * The stored value is a bare multiplier so the CSS `calc()` stays trivial;
 * the field shows percent because a percentage is what a reader means.
 *
 * @constant
 */
const SCALE_AS_PERCENT = 100;

/**
 * Props for {@link PreferencesModal}.
 *
 * @interface PreferencesModalProps
 * @property {boolean} isOpen - Whether the modal is visible
 * @property {() => void} onClose - Called when the modal closes
 */
export interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Renders the reader preferences panel.
 *
 * @component
 * @param {PreferencesModalProps} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {() => void} props.onClose - Called when the modal closes
 * @returns {JSX.Element} The preferences modal
 */
export function PreferencesModal({
  isOpen,
  onClose,
}: PreferencesModalProps): JSX.Element {
  const t = useTranslations('preferences');
  const { textScale, proseMeasure, constrainedHue, streamText, sectionDecor } =
    useDisplayPrefsState();
  const {
    setTextScale,
    setProseMeasure,
    setConstrainedHue,
    setStreamText,
    setSectionDecor,
  } = useDisplayPrefsActions();
  const immersive = useImmersiveMode();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('title')}
      className={styles.preferencesModal}
      bodyClassName={styles.body}>
      <div className={styles.fields}>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor='pref-text-scale'>
            {t('textSize')}
          </label>
          <span className={styles.fieldHint}>{t('textSizeHint')}</span>
          <div className={styles.control}>
            <NumericInput
              id='pref-text-scale'
              value={Math.round(textScale * SCALE_AS_PERCENT)}
              onChange={(value) =>
                setTextScale(
                  value === undefined
                    ? DEFAULT_TEXT_SCALE
                    : value / SCALE_AS_PERCENT,
                )
              }
              ariaLabel={t('textSize')}
              showChevrons
              step={5}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor='pref-prose-measure'>
            {t('proseMeasure')}
          </label>
          <span className={styles.fieldHint}>{t('proseMeasureHint')}</span>
          <div className={styles.control}>
            <NumericInput
              id='pref-prose-measure'
              value={proseMeasure}
              onChange={(value) =>
                setProseMeasure(
                  value === undefined ? DEFAULT_PROSE_MEASURE : value,
                )
              }
              ariaLabel={t('proseMeasure')}
              showChevrons
              step={5}
            />
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>{t('constrainedHue')}</span>
          <span className={styles.fieldHint}>{t('constrainedHueHint')}</span>
          <div className={styles.control}>
            <PipCheckbox
              checked={constrainedHue}
              onChange={setConstrainedHue}
              ariaLabel={t('constrainedHue')}
              size='lg'
            />
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>{t('theme')}</span>
          <span className={styles.fieldHint}>{t('themeHint')}</span>
          <div className={styles.control}>
            <ThemeToggleButton ariaLabel={t('themeToggle')} />
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>{t('streamText')}</span>
          <span className={styles.fieldHint}>{t('streamTextHint')}</span>
          <div className={styles.control}>
            <PipCheckbox
              checked={streamText}
              onChange={setStreamText}
              ariaLabel={t('streamText')}
              size='lg'
            />
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>{t('sectionDecor')}</span>
          <span className={styles.fieldHint}>{t('sectionDecorHint')}</span>
          <div className={styles.control}>
            <PipCheckbox
              checked={sectionDecor}
              onChange={setSectionDecor}
              ariaLabel={t('sectionDecor')}
              size='lg'
            />
          </div>
        </div>

        {immersive.supported && (
          <div className={styles.field}>
            <span className={styles.fieldLabel}>{t('immersive')}</span>
            <span className={styles.fieldHint}>{t('immersiveHint')}</span>
            <div className={styles.control}>
              <PipCheckbox
                checked={immersive.active}
                onChange={immersive.toggle}
                ariaLabel={t('immersive')}
                size='lg'
              />
            </div>
          </div>
        )}

        <div className={`${styles.field} ${styles.fieldWide}`}>
          <span className={styles.fieldLabel}>{t('units')}</span>
          <span className={styles.fieldHint}>{t('unitsHint')}</span>
          <div className={styles.control}>
            <UnitSwitcher embedded />
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default PreferencesModal;
