'use client';

import { useEffect } from 'react';

/**
 * Enables automatic hash navigation for elements with data-anchor attributes.
 * 
 * Listens for hash changes in the URL and smoothly scrolls to the first element
 * with a matching `data-anchor` attribute. Also handles initial page load if a
 * hash is already present in the URL.
 * 
 * @remarks
 * This hook must be used in a client component. It sets up event listeners for
 * the 'hashchange' event and cleans them up on unmount.
 * 
 * @example
 * // In a client component:
 * 'use client';
 * 
 * export default function Page() {
 *   useHashNavigation();
 *   return <div>{content}</div>;
 * }
 * 
 * @example
 * // Navigate to an anchor programmatically:
 * window.location.hash = '#my-section';
 * // Will scroll to: <h2 data-anchor="my-section">My Section</h2>
 * 
 * @returns {void}
 */
export function useHashNavigation(): void {
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      
      if (!hash) return;
      
      const element = document.querySelector(`[data-anchor="${hash}"]`);
      
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    };
    
    handleHashChange();
    
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);
}
