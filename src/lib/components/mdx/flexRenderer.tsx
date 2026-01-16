import React from 'react';

type FlexRendererProps = {
  /** Any React nodes to be laid out horizontally */
  children: React.ReactNode;
};

/**
 * Generic horizontal flex container that lays out its children in a row,
 * with spacing and horizontal scrolling support.
 *
 * @param props - Component props.
 * @param props.children - React nodes to render inside the flex container.
 * @returns JSX element rendering children in a horizontal flexbox.
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
