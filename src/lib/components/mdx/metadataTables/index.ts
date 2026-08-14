/**
 * @fileoverview Re-exports the metadata table component and its types.
 * @description Exports MetadataTable, MetadataRow, and ColumnConfig from metadataTable.
 * 
 * @module MetadataTable
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @example
 * ```tsx
 * // Import generic table
 * import { MetadataTable } from '@/modules/library/presentation/components/MetadataTable';
 * 
 * // Import types
 * import type { MetadataRow, ColumnConfig } from '@/modules/library/presentation/components/MetadataTable';
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
