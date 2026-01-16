/**
 * @fileoverview Metadata table component exports - interactive data browsing system.
 * @description Provides filterable, sortable, paginated tables for structured content.
 * Includes generic MetadataTable component for client-side data display.
 * 
 * @module MetadataTable
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @example
 * ```tsx
 * // Import generic table
 * import { MetadataTable } from '@/lib/components/mdx/MetadataTable';
 * 
 * // Import types
 * import type { MetadataRow, ColumnConfig } from '@/lib/components/mdx/MetadataTable';
 * ```
 */

/**
 * Generic filterable, sortable table for any JSON data structure.
 * @see {@link module:metadataTable}
 */
export { default as MetadataTable } from './metadataTable';

/**
 * Type definitions for metadata table system.
 * @typedef {import('./metadataTable').MetadataRow} MetadataRow - Generic data row
 * @typedef {import('./metadataTable').ColumnConfig} ColumnConfig - Column configuration
 */
export type { MetadataRow, ColumnConfig } from './metadataTable';
