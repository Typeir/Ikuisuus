/**
 * @fileoverview Module for src/app/[locale]/library/not-found.tsx
 * @module src/app/[locale]/library/not-found
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */
import { NotFoundContent } from '@/lib/components/notFoundContent/notFoundContent';

/**
 * 404 Not Found Page with Smart Redirect
 * 
 * Uses Levenshtein distance to find the nearest matching route
 * and suggests it to the user.
 */
export default function NotFound() {
  return <NotFoundContent />;
}
