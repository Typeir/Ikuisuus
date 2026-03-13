/**
 * @fileoverview Encounter Planner Page
 * @description Dedicated page for the encounter planner tool at /[locale]/utils/encounter-planner.
 * Provides interface for creating, managing, and tracking combat encounters with full
 * creature stat management, initiative tracking, and condition monitoring.
 * 
 * @module encounterPlannerPage
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @requires @/lib/components/encounterPlanner Main encounter planner component
 * 
 * @example
 * ```
 * Route: /en/utils/encounter-planner
 * Route: /es/utils/encounter-planner
 * ```
 */

import { EncounterPlanner } from '@/lib/components/encounterPlanner';

/**
 * Page props interface
 * @interface PageProps
 * @property {Promise<Object>} params - Route parameters (async in Next.js 15)
 * @property {string} params.locale - Current locale from route segment
 */
interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

/**
 * Encounter Planner page component.
 * Renders the EncounterPlanner with locale from route parameters.
 * 
 * @async
 * @function EncounterPlannerPage
 * @param {PageProps} props - Page props with locale parameter
 * @param {Promise<{ locale: string }>} props.params - Async route parameters
 * @returns {Promise<JSX.Element>} Rendered page with encounter planner
 */
export default async function EncounterPlannerPage({ params }: PageProps) {
  const { locale } = await params;
  
  return (
    <div>
      <EncounterPlanner locale={locale} />
    </div>
  );
}

/**
 * Generate metadata for the encounter planner page.
 * Sets page title and description for SEO and browser tabs.
 * 
 * @function generateMetadata
 * @returns {Object} Metadata object with title and description
 */
export function generateMetadata() {
  return {
    title: 'Encounter Planner | Library of Ikuisuus',
    description: 'Plan and manage combat encounters with initiative tracking, conditions, and creature details.',
  };
}
