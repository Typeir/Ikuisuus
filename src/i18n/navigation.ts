/**
 * @fileoverview Module for src/i18n/navigation.ts
 * @module src/i18n/navigation
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

/** Lightweight wrappers around Next.js navigation APIs that consider the routing configuration */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
