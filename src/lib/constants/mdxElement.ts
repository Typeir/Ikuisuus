/**
 * @fileoverview Names the compile step writes onto MDX elements.
 * @description Kept apart from the plugin that writes them, so a component
 * reading the attribute does not pull the plugin into its bundle
 *
 * @module lib/constants/mdxElement
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-10
 */

/**
 * Attribute holding the authored name of an MDX component.
 *
 * @description A parent cannot recognise its children by component once those
 * children are client components: on the server the element's type is a client
 * reference and carries no name. The compiler writes the name into the element
 * instead.
 */
export const ELEMENT_NAME_ATTRIBUTE = 'data-element';
