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
