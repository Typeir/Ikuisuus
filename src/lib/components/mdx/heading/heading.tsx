/**
 * @fileoverview Heading Components with Auto-Generated Anchors
 * @description Heading components that automatically generate anchor slugs for hash navigation
 *
 * @module heading
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import React, { ReactNode } from 'react';

/**
 * Converts text to a URL-friendly slug for use as heading anchors.
 *
 * Transforms heading text into lowercase, hyphen-separated format suitable
 * for use in data-anchor attributes and URL hashes.
 *
 * @param {string} text - The heading text to convert
 * @returns {string} Slug-formatted string (lowercase, hyphen-separated)
 *
 * @example
 * textToSlug('My Awesome Heading!');
 * // Returns: 'my-awesome-heading'
 *
 * @example
 * textToSlug('  Multiple   Spaces  ');
 * // Returns: 'multiple-spaces'
 */
function textToSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^\w\-]/g, '') // Remove non-word characters except hyphens
    .replace(/\-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^\-+|\-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Extracts text content from React children recursively.
 *
 * Handles strings, numbers, arrays, and nested React elements to produce
 * a flat string representation of all text content. Used to generate anchor
 * slugs from heading content that may contain formatting elements.
 *
 * @param {ReactNode} children - React children to extract text from
 * @returns {string} Concatenated text content
 *
 * @example
 * getTextFromChildren('Simple text');
 * // Returns: 'Simple text'
 *
 * @example
 * getTextFromChildren(<span>Bold <strong>text</strong></span>);
 * // Returns: 'Bold text'
 */
function getTextFromChildren(children: ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children.map(getTextFromChildren).join('');
  }
  if (React.isValidElement(children) && children.props.children) {
    return getTextFromChildren(children.props.children);
  }
  return '';
}

/**
 * Props for the Heading component.
 *
 * @property {1 | 2 | 3 | 4 | 5 | 6} level - HTML heading level (h1-h6)
 * @property {ReactNode} children - Heading content (text or React elements)
 * @property {string} [anchor] - Custom anchor slug (auto-generated if omitted)
 * @property {string} [className] - Additional CSS classes to apply
 */
interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children?: ReactNode;
  anchor?: string;
  className?: string;
}

/**
 * Generic heading component that auto-generates data-anchor attributes from heading text.
 *
 * Renders semantic HTML heading elements (h1-h6) with `data-anchor` attributes for
 * hash navigation. Automatically extracts text from children and converts to a slug
 * unless a custom anchor is provided.
 *
 * @param {HeadingProps} props - Component props
 * @param {1 | 2 | 3 | 4 | 5 | 6} props.level - HTML heading level
 * @param {ReactNode} props.children - Heading content
 * @param {string} [props.anchor] - Custom anchor (overrides auto-generation)
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} Heading element with data-anchor attribute
 *
 * @remarks
 * Uses `data-anchor` instead of `id` to avoid HTML uniqueness constraints.
 * Works with `HashNavigationProvider` for automatic scroll-to-anchor behavior.
 *
 * @example
 * <Heading level={2}>My Section Title</Heading>
 * // Renders: <h2 data-anchor="my-section-title">My Section Title</h2>
 *
 * @example
 * // With custom anchor:
 * <Heading level={3} anchor="custom-slug">Complex <em>Formatted</em> Title</Heading>
 * // Renders: <h3 data-anchor="custom-slug">Complex <em>Formatted</em> Title</h3>
 *
 * @example
 * // Navigate programmatically:
 * window.location.hash = '#my-section-title';
 * // With HashNavigationProvider, will scroll to the heading
 */
export function Heading({
  level,
  children,
  anchor,
  className,
}: HeadingProps): JSX.Element {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  const headingText = getTextFromChildren(children);
  const headingAnchor = anchor || textToSlug(headingText);

  const props = {
    'data-anchor': headingAnchor,
    className,
  };

  return React.createElement(Tag, props, children);
}

/**
 * H1 heading component with auto-generated data-anchor.
 *
 * @param {Omit<HeadingProps, 'level'>} props - Component props (excluding level)
 * @param {ReactNode} props.children - Heading content
 * @param {string} [props.anchor] - Custom anchor slug
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} h1 element with data-anchor
 *
 * @example
 * <H1>Main Title</H1>
 * // Renders: <h1 data-anchor="main-title">Main Title</h1>
 */
export function H1({
  children,
  anchor,
  className,
}: Omit<HeadingProps, 'level'>): JSX.Element {
  return (
    <Heading level={1} anchor={anchor} className={className}>
      {children}
    </Heading>
  );
}

/**
 * H2 heading component with auto-generated data-anchor.
 *
 * @param {Omit<HeadingProps, 'level'>} props - Component props (excluding level)
 * @param {ReactNode} props.children - Heading content
 * @param {string} [props.anchor] - Custom anchor slug
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} h2 element with data-anchor
 *
 * @example
 * <H2>Section Title</H2>
 * // Renders: <h2 data-anchor="section-title">Section Title</h2>
 */
export function H2({
  children,
  anchor,
  className,
}: Omit<HeadingProps, 'level'>): JSX.Element {
  return (
    <Heading level={2} anchor={anchor} className={className}>
      {children}
    </Heading>
  );
}

/**
 * H3 heading component with auto-generated data-anchor.
 *
 * @param {Omit<HeadingProps, 'level'>} props - Component props (excluding level)
 * @param {ReactNode} props.children - Heading content
 * @param {string} [props.anchor] - Custom anchor slug
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} h3 element with data-anchor
 *
 * @example
 * <H3>Subsection Title</H3>
 * // Renders: <h3 data-anchor="subsection-title">Subsection Title</h3>
 */
export function H3({
  children,
  anchor,
  className,
}: Omit<HeadingProps, 'level'>): JSX.Element {
  return (
    <Heading level={3} anchor={anchor} className={className}>
      {children}
    </Heading>
  );
}

/**
 * H4 heading component with auto-generated data-anchor.
 *
 * @param {Omit<HeadingProps, 'level'>} props - Component props (excluding level)
 * @param {ReactNode} props.children - Heading content
 * @param {string} [props.anchor] - Custom anchor slug
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} h4 element with data-anchor
 *
 * @example
 * <H4>Detail Section</H4>
 * // Renders: <h4 data-anchor="detail-section">Detail Section</h4>
 */
export function H4({
  children,
  anchor,
  className,
}: Omit<HeadingProps, 'level'>): JSX.Element {
  return (
    <Heading level={4} anchor={anchor} className={className}>
      {children}
    </Heading>
  );
}

/**
 * H5 heading component with auto-generated data-anchor.
 *
 * @param {Omit<HeadingProps, 'level'>} props - Component props (excluding level)
 * @param {ReactNode} props.children - Heading content
 * @param {string} [props.anchor] - Custom anchor slug
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} h5 element with data-anchor
 *
 * @example
 * <H5>Subdetail Heading</H5>
 * // Renders: <h5 data-anchor="subdetail-heading">Subdetail Heading</h5>
 */
export function H5({
  children,
  anchor,
  className,
}: Omit<HeadingProps, 'level'>): JSX.Element {
  return (
    <Heading level={5} anchor={anchor} className={className}>
      {children}
    </Heading>
  );
}

/**
 * H6 heading component with auto-generated data-anchor.
 *
 * @param {Omit<HeadingProps, 'level'>} props - Component props (excluding level)
 * @param {ReactNode} props.children - Heading content
 * @param {string} [props.anchor] - Custom anchor slug
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} h6 element with data-anchor
 *
 * @example
 * <H6>Minor Heading</H6>
 * // Renders: <h6 data-anchor="minor-heading">Minor Heading</h6>
 */
export function H6({
  children,
  anchor,
  className,
}: Omit<HeadingProps, 'level'>): JSX.Element {
  return (
    <Heading level={6} anchor={anchor} className={className}>
      {children}
    </Heading>
  );
}
