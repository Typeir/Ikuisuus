/**
 * @fileoverview Flex Renderer Component
 * @description Generic horizontal flex container that lays out its children in a row,
 * with spacing and horizontal scrolling support.
 *
 * @module flexRenderer
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import React from 'react';

type FlexRendererProps = {
  /** Any React nodes to be laid out horizontally */
  children: React.ReactNode;
};

/**
 * Generic horizontal flex container that lays out its children in a row,
 * with spacing and horizontal scrolling support.
 *
 * @param {FlexRendererProps} props - Component props.
 * @param {React.ReactNode} props.children - React nodes to render inside the flex container.
 * @returns {JSX.Element} JSX element rendering children in a horizontal flexbox.
 */
const FlexRenderer: React.FC<FlexRendererProps> = ({ children }) => {
  return (
    <div
      className='flex flex-row gap-10 py-2 overflow-x-hidden'
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '5rem',
        padding: '0.5rem 0',
      }}>
      {children}
    </div>
  );
};

export default FlexRenderer;
