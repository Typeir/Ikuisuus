/**
 * @fileoverview Tabs Primitive Tests
 * @description Smoke tests covering active-tab rendering, click activation,
 * keyboard navigation, and ARIA wiring for the Tabs primitive.
 *
 * @module tests/unit/src/lib/components/ui/tabs/tabs.test
 */

import { Tab, TabList, TabPanel, Tabs } from '@/lib/components/ui/tabs';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

/**
 * Controlled-state `<Tabs>` harness for use by tests.
 *
 * @function Harness
 * @returns {JSX.Element} Rendered tabs harness
 */
function Harness(): JSX.Element {
  const [value, setValue] = useState('one');
  return (
    <Tabs value={value} onChange={setValue} ariaLabel='harness'>
      <TabList ariaLabel='harness-list'>
        <Tab value='one'>One</Tab>
        <Tab value='two'>Two</Tab>
        <Tab value='three' disabled>
          Three
        </Tab>
      </TabList>
      <TabPanel value='one'>Panel One</TabPanel>
      <TabPanel value='two'>Panel Two</TabPanel>
      <TabPanel value='three'>Panel Three</TabPanel>
    </Tabs>
  );
}

describe('Tabs', () => {
  it('renders the active panel only', () => {
    render(<Harness />);
    expect(screen.getByText('Panel One')).toBeInTheDocument();
    expect(screen.queryByText('Panel Two')).not.toBeInTheDocument();
  });

  it('switches panels when a tab is clicked', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('tab', { name: 'Two' }));
    expect(screen.getByText('Panel Two')).toBeInTheDocument();
    expect(screen.queryByText('Panel One')).not.toBeInTheDocument();
  });

  it('skips disabled tabs during keyboard navigation', () => {
    render(<Harness />);
    const first = screen.getByRole('tab', { name: 'One' });
    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Two' }), {
      key: 'ArrowRight',
    });
    expect(screen.getByRole('tab', { name: 'One' })).toHaveFocus();
  });

  it('exposes correct ARIA selection state', () => {
    render(<Harness />);
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });
});
