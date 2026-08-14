/**
 * @fileoverview Module for src/app/[locale]/utils/themeSelectorLayout.tsx
 * @module src/app/[locale]/utils/themeSelectorLayout
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */
"use client";

import type { JSX } from 'react';
import {
    ThemeSelector,
    ThemeSelectorProps,
} from "@/lib/components/themeSelector/themeSelector";
import { PersistentData } from "@/lib/enums/persistentData";
import { Theme } from "@/lib/enums/themes";
import { storePersistentData } from "@/lib/utils/storePersistentData";
import { useEffect } from "react";
import { fetchPersistentData } from "../../../lib/utils/fetchPersistentData";

/**
 * A force theme function.
 *
 * @param {Theme} props.defaultTheme - The theme to use.
 * @returns {void}
 */
const forceTheme = (newTheme: Theme) => {
  document.documentElement.setAttribute(PersistentData.Theme, newTheme);
};

/**
 * Wraps {@link ThemeSelector}. Reads the persisted theme, applies it on mount, and saves changes via {@link storePersistentData}.
 *
 * @param {ThemeSelectorProps} props - The props for the layout.
 * @param {Theme} props.defaultTheme - The initial theme to use.
 * @returns {JSX.Element} A JSX element rendering the ThemeSelector.
 */
export const ThemeSelectorLayout = ({}: ThemeSelectorProps): JSX.Element => {
  const currentTheme = fetchPersistentData(PersistentData.Theme) || Theme.Dark;
  useEffect(() => {
    forceTheme(currentTheme as Theme);
  }, [currentTheme]);
  return (
    <ThemeSelector
      defaultTheme={currentTheme as Theme}
      /**
       * Stores the theme persistently and applies it to the DOM.
       *
       * @param {Theme} newTheme - The newly selected theme.
       */
      onThemeChange={(newTheme) => {
        storePersistentData(PersistentData.Theme, newTheme);
        forceTheme(newTheme);
      }}
    />
  );
};
