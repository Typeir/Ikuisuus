/**
 * Persistent UI Storage
 *
 * @fileoverview Reads persisted UI state from the storage port and writes it
 * back, stamping the root element with the attributes and custom properties
 * the stylesheets key off.
 *
 * @module lib/context/persistentUiStorage
 * @version 1.0.0
 * @author Typeir
 * @since 9.0.0
 */

import { deriveExpandedPathsFromUrl } from '@/modules/library/application/selectors/deriveExpandedPathsFromUrl';
import { isStaticContentRoute } from '@/modules/library/application/selectors/isStaticContentRoute';
import {
  ASPECT_DISPLAY_MODES,
  type AspectDisplayMode,
  DEFAULT_PROSE_MEASURE,
  DEFAULT_SECTION_DECOR,
  DEFAULT_STREAM_TEXT,
  DEFAULT_TEXT_SCALE,
  DEFAULT_UNIT_SYSTEM,
  LEGACY_THEME_KEY,
  PERSISTENT_UI_STORAGE_KEY,
  type PersistentUiState,
  readPositiveNumber,
  type SerializedPersistentUiState,
  type ThemeValue,
  type UnitSystemPreferences,
  type UnitSystemValue,
} from '../types/persistentUiState';
import { fetchPersistentData } from '../utils/fetchPersistentData';
import { storePersistentData } from '../utils/storePersistentData';

/** Recognised display systems. */
const SYSTEMS: readonly UnitSystemValue[] = ['stride', 'metric', 'imperial'];

/**
 * Normalize stored unit preference to per-dimension shape.
 *
 * @param {UnitSystemPreferences | UnitSystemValue | undefined} stored - Raw stored value
 * @returns {UnitSystemPreferences} Normalized preferences
 */
function readUnitSystem(
  stored: UnitSystemPreferences | UnitSystemValue | undefined,
): UnitSystemPreferences {
  if (typeof stored === 'string') {
    return SYSTEMS.includes(stored)
      ? { distance: stored, weight: stored, volume: stored }
      : DEFAULT_UNIT_SYSTEM;
  }

  if (!stored || typeof stored !== 'object') {
    return DEFAULT_UNIT_SYSTEM;
  }

  const pick = (value: UnitSystemValue, fallback: UnitSystemValue) =>
    SYSTEMS.includes(value) ? value : fallback;

  return {
    distance: pick(stored.distance, DEFAULT_UNIT_SYSTEM.distance),
    weight: pick(stored.weight, DEFAULT_UNIT_SYSTEM.weight),
    volume: pick(stored.volume, DEFAULT_UNIT_SYSTEM.volume),
  };
}

/**
 * Reads persisted state with server-provided expanded paths for SSR.
 *
 * Falls back to URL-derived or default values when no persisted state exists.
 *
 * @function readPersistedState
 * @param {string[]} serverExpandedPaths - Paths from server cookies for hydration match
 * @returns {SerializedPersistentUiState & { unitSystem: UnitSystemPreferences }} Hydrated values
 */
export function readPersistedState(
  serverExpandedPaths: string[],
): SerializedPersistentUiState & { unitSystem: UnitSystemPreferences } {
  let expandedPaths: string[] = [];
  const isStatic = isStaticContentRoute();

  if (isStatic) {
    expandedPaths =
      serverExpandedPaths.length > 0
        ? serverExpandedPaths
        : deriveExpandedPathsFromUrl();
  } else {
    const storedPaths = fetchPersistentData(PERSISTENT_UI_STORAGE_KEY);
    if (storedPaths) {
      try {
        const parsed = JSON.parse(storedPaths) as SerializedPersistentUiState;
        if (parsed.sidebarMenu?.expandedPaths) {
          expandedPaths = parsed.sidebarMenu.expandedPaths;
        }
      } catch {
        expandedPaths = deriveExpandedPathsFromUrl();
      }
    }

    if (expandedPaths.length === 0) {
      expandedPaths = deriveExpandedPathsFromUrl();
    }
  }

  let theme: ThemeValue = 'dark';
  let unitSystem: UnitSystemPreferences = DEFAULT_UNIT_SYSTEM;
  let correctionsToken: string | null = null;
  let aspectExpanded = false;
  let aspectDisplay: AspectDisplayMode = 'compact';
  let textScale = DEFAULT_TEXT_SCALE;
  let proseMeasure = DEFAULT_PROSE_MEASURE;
  let constrainedHue = false;
  let streamText = DEFAULT_STREAM_TEXT;
  let sectionDecor = DEFAULT_SECTION_DECOR;
  const stored = fetchPersistentData(PERSISTENT_UI_STORAGE_KEY);

  if (stored) {
    try {
      const parsed = JSON.parse(stored) as SerializedPersistentUiState;
      if (parsed.theme === 'dark' || parsed.theme === 'light') {
        theme = parsed.theme;
      }
      unitSystem = readUnitSystem(parsed.unitSystem);
      if (
        typeof parsed.correctionsToken === 'string' ||
        parsed.correctionsToken === null
      ) {
        correctionsToken = parsed.correctionsToken;
      }
      if (typeof parsed.aspectExpanded === 'boolean') {
        aspectExpanded = parsed.aspectExpanded;
      }
      if (
        parsed.aspectDisplay &&
        ASPECT_DISPLAY_MODES.includes(parsed.aspectDisplay)
      ) {
        aspectDisplay = parsed.aspectDisplay;
      }
      textScale = readPositiveNumber(parsed.textScale, DEFAULT_TEXT_SCALE);
      proseMeasure = readPositiveNumber(
        parsed.proseMeasure,
        DEFAULT_PROSE_MEASURE,
      );
      if (typeof parsed.constrainedHue === 'boolean') {
        constrainedHue = parsed.constrainedHue;
      }
      if (typeof parsed.streamText === 'boolean') {
        streamText = parsed.streamText;
      }
      if (typeof parsed.sectionDecor === 'boolean') {
        sectionDecor = parsed.sectionDecor;
      }
    } catch {
      const legacyTheme = fetchPersistentData(LEGACY_THEME_KEY);
      if (legacyTheme === 'dark' || legacyTheme === 'light') {
        theme = legacyTheme;
      }
    }
  } else {
    const legacyTheme = fetchPersistentData(LEGACY_THEME_KEY);
    if (legacyTheme === 'dark' || legacyTheme === 'light') {
      theme = legacyTheme;
    }
  }

  return {
    theme,
    unitSystem,
    correctionsToken,
    aspectExpanded,
    aspectDisplay,
    textScale,
    proseMeasure,
    constrainedHue,
    streamText,
    sectionDecor,
    sidebarMenu: { expandedPaths, isOpen: false },
  };
}

/**
 * Writes state to persistent storage and stamps the root element.
 *
 * Preferences land on the root rather than being passed down so components
 * react through CSS alone. Numeric preferences are custom properties because
 * a reader types an arbitrary value, leaving no finite set of classes.
 *
 * @function writePersistedState
 * @param {PersistentUiState} state - Current UI state to persist
 * @returns {void}
 */
export function writePersistedState(state: PersistentUiState): void {
  if (typeof window === 'undefined') return;

  const serialized: SerializedPersistentUiState = {
    sidebarMenu: state.sidebarMenu,
    theme: state.theme,
    unitSystem: state.unitSystem,
    correctionsToken: state.correctionsToken,
    aspectExpanded: state.aspectExpanded,
    aspectDisplay: state.aspectDisplay,
    textScale: state.textScale,
    proseMeasure: state.proseMeasure,
    constrainedHue: state.constrainedHue,
    streamText: state.streamText,
    sectionDecor: state.sectionDecor,
  };

  storePersistentData(PERSISTENT_UI_STORAGE_KEY, JSON.stringify(serialized));
  storePersistentData(LEGACY_THEME_KEY, state.theme);

  const root = document.documentElement;
  root.setAttribute('data-theme', state.theme);
  root.setAttribute(
    'data-aspect-expanded',
    state.aspectExpanded ? 'true' : 'false',
  );
  root.setAttribute('data-aspect-display', state.aspectDisplay);
  root.setAttribute(
    'data-constrained-hue',
    state.constrainedHue ? 'true' : 'false',
  );
  root.setAttribute('data-stream-text', state.streamText ? 'true' : 'false');
  root.setAttribute(
    'data-section-decor',
    state.sectionDecor ? 'true' : 'false',
  );
  root.style.setProperty('--text-scale-user', String(state.textScale));
  root.style.setProperty('--prose-measure', `${state.proseMeasure}ch`);
}
